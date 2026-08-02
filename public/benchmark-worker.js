let cancelled = false;
let runToken = 0;
let retainedMemoryBlocks = [];

function createRetainedMemoryBlock(bytes) {
  const pageBytes = 64 * 1024;
  if (
    typeof WebAssembly !== "undefined" &&
    typeof WebAssembly.Memory === "function"
  ) {
    try {
      const pages = Math.max(1, Math.ceil(bytes / pageBytes));
      const memory = new WebAssembly.Memory({
        initial: pages,
        maximum: pages,
      });
      return {
        allocator: "webassembly",
        byteLength: memory.buffer.byteLength,
        memory,
        view: new Uint8Array(memory.buffer),
      };
    } catch {
      // A typed-array block preserves the test on older implementations.
    }
  }
  const view = new Uint8Array(bytes);
  return {
    allocator: "typed-array",
    byteLength: view.byteLength,
    memory: null,
    view,
  };
}

async function runObjectChurn(data, token) {
  const rounds = Math.max(4, data.gcRounds || 6);
  const objectsPerRound = Math.min(
    60000,
    Math.max(12000, Math.round(data.targetMB * 45)),
  );
  const generations = [];
  const roundTimes = [];
  let checksum = 0;

  for (
    let round = 0;
    round < rounds && !cancelled && token === runToken;
    round += 1
  ) {
    const started = performance.now();
    const records = new Array(objectsPerRound);
    for (let index = 0; index < objectsPerRound; index += 1) {
      const value = (data.seed * 2654435761 + round * 8191 + index) >>> 0;
      records[index] = {
        id: value,
        sender: `person-${value & 4095}`,
        subject: `message-${(value >>> 5).toString(36)}`,
        cells: [value & 1023, (value >>> 10) & 1023, value % 97],
        selected: (value & 7) === 0,
      };
      checksum = (checksum ^ value) >>> 0;
    }
    generations.push(records);
    if (generations.length > 2) generations.shift();
    roundTimes.push(performance.now() - started);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return {
    gcChurnMs: roundTimes.reduce((sum, value) => sum + value, 0),
    gcWorstRoundMs: Math.max(...roundTimes, 0),
    gcObjectsCreated: roundTimes.length * objectsPerRound,
    checksum,
  };
}

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
  const chunkBytes = Math.max(8, data.chunkMB || 32) * 1024 * 1024;
  let retainedBytes = retainedMemoryBlocks.reduce(
    (total, block) => total + block.byteLength,
    0,
  );
  const retainedBeforeBytes = retainedBytes;
  let checksum = 0;
  let allocator = "webassembly";
  const allocationStart = performance.now();

  while (
    retainedBytes < targetBytes &&
    !cancelled &&
    token === runToken
  ) {
    const bytes = Math.min(chunkBytes, targetBytes - retainedBytes);
    const block = createRetainedMemoryBlock(bytes);
    if (block.allocator !== "webassembly") allocator = "typed-array";
    for (let offset = 0; offset < block.view.length; offset += 4096) {
      const value = (offset + retainedBytes + data.seed * 131) & 255;
      block.view[offset] = value;
      checksum = (checksum + value) >>> 0;
    }
    retainedMemoryBlocks.push(block);
    retainedBytes += block.byteLength;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const allocationMs = performance.now() - allocationStart;

  const scanStart = performance.now();
  const scanDeadline = scanStart + Math.max(0, data.scanDurationMs || 0);
  const scanStride = Math.max(64, data.scanStride || 64);
  let scannedBytes = 0;
  do {
    for (const block of retainedMemoryBlocks) {
      const view = block.view;
      for (let offset = 0; offset < view.length; offset += scanStride) {
        const value = (view[offset] + 1) & 255;
        view[offset] = value;
        checksum = (checksum ^ value) >>> 0;
        scannedBytes += scanStride;
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
  const sweepMBps =
    scanMs > 0 ? scannedBytes / (1024 * 1024) / (scanMs / 1000) : 0;
  const gc = await runObjectChurn(data, token);
  checksum = (checksum ^ gc.checksum) >>> 0;

  self.postMessage({
    type: "memory-complete",
    requestId: data.requestId,
    retainedMB: retainedBytes / (1024 * 1024),
    addedMB: (retainedBytes - retainedBeforeBytes) / (1024 * 1024),
    allocator,
    allocationMs,
    scanMs,
    scannedMB: scannedBytes / (1024 * 1024),
    sweepMBps,
    gcChurnMs: gc.gcChurnMs,
    gcWorstRoundMs: gc.gcWorstRoundMs,
    gcObjectsCreated: gc.gcObjectsCreated,
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
    const totalBytes = Math.max(1, data.sizeMB) * 1024 * 1024;
    const block = new Uint8Array(256 * 1024);
    const warmupCount = Math.max(0, data.warmupCount || 0);
    const repetitionCount = Math.max(1, data.repetitionCount || 1);
    const samples = [];
    let checksum = 0;
    let verified = true;

    for (
      let repetition = -warmupCount;
      repetition < repetitionCount && !cancelled;
      repetition += 1
    ) {
      const sampleSeed = (data.seed || 1) + repetition + warmupCount;
      for (let offset = 0; offset < block.length; offset += 1)
        block[offset] = (offset * 31 + sampleSeed * 17) & 255;

      accessHandle = await fileHandle.createSyncAccessHandle();
      accessHandle.truncate(0);
      let written = 0;
      const writeStart = performance.now();
      while (written < totalBytes && !cancelled) {
        const bytes = Math.min(block.length, totalBytes - written);
        const amount = accessHandle.write(block.subarray(0, bytes), {
          at: written,
        });
        if (amount <= 0) throw new Error("OPFS partial write");
        written += amount;
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
      let randomState = sampleSeed >>> 0;
      let sampleVerified = accessHandle.getSize() === totalBytes;
      const randomReadStart = performance.now();
      for (let operation = 0; operation < data.randomReads; operation += 1) {
        randomState = (randomState * 1664525 + 1013904223) >>> 0;
        const maximumOffset = Math.max(0, totalBytes - readBuffer.length);
        const at = maximumOffset ? randomState % maximumOffset : 0;
        const read = accessHandle.read(readBuffer, { at });
        const expected = ((at % block.length) * 31 + sampleSeed * 17) & 255;
        sampleVerified =
          sampleVerified && read === readBuffer.length && readBuffer[0] === expected;
        checksum = (checksum ^ readBuffer[0]) >>> 0;
      }
      const randomReadMs = performance.now() - randomReadStart;
      accessHandle.close();
      accessHandle = null;
      verified = verified && sampleVerified;
      if (repetition >= 0)
        samples.push({
          writeMs,
          flushMs,
          reopenMs,
          randomReadMs,
          verified: sampleVerified,
        });
    }
    await root.removeEntry(filename);

    self.postMessage({
      type: "opfs-complete",
      requestId: data.requestId,
      available: true,
      sizeMB: data.sizeMB,
      randomReads: data.randomReads,
      samples,
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

  if (event.data?.type === "memory-initialize") {
    const block = createRetainedMemoryBlock(1024 * 1024);
    block.view[0] = 1;
    retainedMemoryBlocks = [];
    self.postMessage({
      type: "memory-initialized",
      requestId: event.data.requestId,
      allocator: block.allocator,
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
