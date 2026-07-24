let cancelled = false;
let runToken = 0;

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

self.onmessage = (event) => {
  if (event.data?.type === "cancel") {
    cancelled = true;
    runToken += 1;
    return;
  }

  if (event.data?.type !== "start") return;
  cancelled = false;
  runChunked(event.data);
};
