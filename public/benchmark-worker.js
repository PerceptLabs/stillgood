let cancelled = false;

function seededWork(seed, workUnits) {
  let value = seed >>> 0;
  const rows = [];

  for (let index = 0; index < workUnits * 1800; index += 1) {
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

self.onmessage = (event) => {
  if (event.data?.type === "cancel") {
    cancelled = true;
    return;
  }

  if (event.data?.type !== "start") return;

  cancelled = false;
  const deadline = performance.now() + event.data.durationMs;
  let round = 0;
  let checksum = 0;

  while (!cancelled && performance.now() < deadline) {
    checksum ^= seededWork(event.data.seed + round, event.data.workUnits);
    round += 1;
    if (round % 3 === 0) {
      self.postMessage({ type: "heartbeat", round });
    }
  }

  self.postMessage({ type: "complete", round, checksum });
};
