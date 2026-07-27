let cancelled = false;
let runToken = 0;
let retainedMemoryBlocks = [];

function seededWork(seed, workUnits) {
  let value = seed >>> 0;
  const rows = [];

  for (let index = 0; index < workUnits * 900; index += 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    rows.push({
      id: index,
      key: value % 100000,
      label: `record-${value.toString(36)}`,
    });
  }

  rows.sort((a, b) => a.key - b.key || a.id - b.id);
  return rows.reduce((checksum, row) => (checksum + row.key) >>> 0, 0);
}

function runChunked(data) {
  const token = ++runToken;
  const deadline = performance.now() + data.durationMs;
  let round = 0;
  let checksum = 0;

  const runChunk = () => {
    if (cancelled || token !== runToken || performance.now() >= deadline) {
      self.postMessage({ type: "complete", round, checksum });
      return;
    }

    checksum ^= seededWork(data.seed + round, data.workUnits);
    round += 1;
    if (round % 2 === 0) {
      self.postMessage({ type: "heartbeat", round });
    }
    setTimeout(runChunk, 0);
  };

  runChunk();
}

async function runMemoryPressure(data) {
  const token = ++runToken;
  const targetBytes = Math.max(0, data.targetMB) * 1024 * 1024;
  const chunkBytes = Math.max(4, data.chunkMB || 8) * 1024 * 1024;
  let retainedBytes = retainedMemoryBlocks.reduce(
    (total, block) => total + block.byteLength,
    0,
  );
  let checksum = 0;
  const allocationStart = performance.now();

  while (
    retainedBytes < targetBytes &&
    !cancelled &&
    token === runToken
  ) {
    const bytes = Math.min(chunkBytes, targetBytes - retainedBytes);
    const block = new Uint8Array(bytes);
    for (let offset = 0; offset < block.length; offset += 4096) {
      const value = (offset + retainedBytes + data.seed * 131) & 255;
      block[offset] = value;
      checksum = (checksum + value) >>> 0;
    }
    retainedMemoryBlocks.push(block);
    retainedBytes += block.byteLength;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const allocationMs = performance.now() - allocationStart;

  const scanStart = performance.now();
  const scanDeadline = scanStart + Math.max(0, data.scanDurationMs || 0);
  do {
    for (const block of retainedMemoryBlocks) {
      for (let offset = 0; offset < block.length; offset += 4096) {
        checksum = (checksum ^ block[offset]) >>> 0;
      }
    }
    if (data.copyBuffer) {
      const copied = new Uint8Array(data.copyBuffer);
      for (let offset = 0; offset < copied.length; offset += 4096) {
        checksum = (checksum + copied[offset]) >>> 0;
      }
    }
    if (performance.now() < scanDeadline)
      await new Promise((resolve) => setTimeout(resolve, 0));
  } while (
    !cancelled &&
    token === runToken &&
    performance.now() < scanDeadline
  );
  const scanMs = performance.now() - scanStart;

  self.postMessage({
    type: "memory-complete",
    requestId: data.requestId,
    retainedMB: retainedBytes / (1024 * 1024),
    allocationMs,
    scanMs,
    checksum,
  });
}

async function runOpfsStorage(data) {
  const filename = "stillgood-storage-temporary.bin";
  let root = null;
  let accessHandle = null;
  try {
    if (!self.navigator.storage?.getDirectory) {
      throw new Error("OPFS unavailable");
    }
    root = await self.navigator.storage.getDirectory();
    try {
      await root.removeEntry(filename);
    } catch {
      // A previous temporary file usually does not exist.
    }
    const fileHandle = await root.getFileHandle(filename, { create: true });
    accessHandle = await fileHandle.createSyncAccessHandle();
    const totalBytes = Math.max(1, data.sizeMB) * 1024 * 1024;
    const block = new Uint8Array(256 * 1024);
    let checksum = 0;
    let written = 0;
    const writeStart = performance.now();
    while (written < totalBytes && !cancelled) {
      const bytes = Math.min(block.length, totalBytes - written);
      for (let offset = 0; offset < bytes; offset += 4096) {
        const value = (written + offset + data.seed * 17) & 255;
        block[offset] = value;
        checksum = (checksum + value) >>> 0;
      }
      written += accessHandle.write(block.subarray(0, bytes), { at: written });
    }
    const writeMs = performance.now() - writeStart;
    const flushStart = performance.now();
    accessHandle.flush();
    const flushMs = performance.now() - flushStart;
    accessHandle.close();
    accessHandle = null;

    const reopenStart = performance.now();
    accessHandle = await fileHandle.createSyncAccessHandle();
    const reopenMs = performance.now() - reopenStart;
    const readBuffer = new Uint8Array(4096);
    let randomState = (data.seed || 1) >>> 0;
    const randomReadStart = performance.now();
    for (let operation = 0; operation < data.randomReads; operation += 1) {
      randomState = (randomState * 1664525 + 1013904223) >>> 0;
      const blockCount = Math.max(1, Math.floor(totalBytes / 4096));
      const at = (randomState % blockCount) * 4096;
      accessHandle.read(readBuffer, { at });
      checksum = (checksum ^ readBuffer[0]) >>> 0;
    }
    const randomReadMs = performance.now() - randomReadStart;
    const verified = accessHandle.getSize() === totalBytes;
    accessHandle.close();
    accessHandle = null;
    await root.removeEntry(filename);

    self.postMessage({
      type: "opfs-complete",
      requestId: data.requestId,
      available: true,
      sizeMB: data.sizeMB,
      randomReads: data.randomReads,
      writeMs,
      flushMs,
      reopenMs,
      randomReadMs,
      verified,
      checksum,
    });
  } catch (error) {
    try {
      accessHandle?.close();
    } catch {
      // Best-effort cleanup after an unsupported or failed storage call.
    }
    try {
      await root?.removeEntry(filename);
    } catch {
      // Best-effort cleanup.
    }
    self.postMessage({
      type: "opfs-complete",
      requestId: data.requestId,
      available: false,
      error: error instanceof Error ? error.message : "OPFS unavailable",
    });
  }
}

self.onmessage = (event) => {
  if (event.data?.type === "cancel") {
    cancelled = true;
    runToken += 1;
    retainedMemoryBlocks = [];
    return;
  }

  if (event.data?.type === "memory-release") {
    retainedMemoryBlocks = [];
    self.postMessage({
      type: "memory-released",
      requestId: event.data.requestId,
    });
    return;
  }

  if (event.data?.type === "memory-pressure") {
    cancelled = false;
    void runMemoryPressure(event.data);
    return;
  }

  if (event.data?.type === "opfs-storage") {
    cancelled = false;
    void runOpfsStorage(event.data);
    return;
  }

  if (event.data?.type !== "start") return;
  cancelled = false;
  runChunked(event.data);
};
