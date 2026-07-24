export const latencyPoints = [
  { value: 100, score: 100 },
  { value: 200, score: 85 },
  { value: 350, score: 65 },
  { value: 500, score: 40 },
  { value: 1000, score: 15 },
  { value: 2000, score: 0 },
];

export const recoveryPoints = [
  { value: 300, score: 100 },
  { value: 1000, score: 85 },
  { value: 3000, score: 65 },
  { value: 5000, score: 40 },
  { value: 10000, score: 15 },
  { value: 20000, score: 0 },
];

export function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1),
  );
  return sorted[index];
}

export function normalizeLower(value, points) {
  if (value <= points[0].value) return points[0].score;
  if (value >= points.at(-1).value) return points.at(-1).score;

  for (let index = 1; index < points.length; index += 1) {
    const lower = points[index - 1];
    const upper = points[index];
    if (value <= upper.value) {
      const fraction = (value - lower.value) / (upper.value - lower.value);
      return lower.score + fraction * (upper.score - lower.score);
    }
  }

  return 0;
}

export function gradeForScore(score) {
  if (score >= 85) return { grade: "A", label: "Comfortable" };
  if (score >= 70) return { grade: "B", label: "Useful" };
  if (score >= 50) return { grade: "C", label: "Light-duty" };
  if (score >= 30) return { grade: "D", label: "Single-purpose" };
  return { grade: "E", label: "Struggling" };
}

function ratioScore(value, good, poor) {
  if (value <= good) return 100;
  if (value >= poor) return 0;
  return 100 - ((value - good) / (poor - good)) * 100;
}

function workloadLevel(p95, pressureP95) {
  if (p95 <= 200 && pressureP95 <= 250) {
    return {
      comfortable: "Everyday work and light multitasking",
      usable: "Moderate browser multitasking",
    };
  }
  if (p95 <= 350 && pressureP95 <= 500) {
    return {
      comfortable: "Everyday work",
      usable: "Light multitasking",
    };
  }
  if (p95 <= 500) {
    return {
      comfortable: "One everyday task",
      usable: "Basic browsing and documents",
    };
  }
  return {
    comfortable: "Simple, focused tasks",
    usable: "One lightweight task at a time",
  };
}

export function summarizeFastRun(metrics) {
  const p75 = percentile(metrics.actionDurations, 0.75);
  const p95 = percentile(metrics.actionDurations, 0.95);
  const pressureP95 = percentile(metrics.pressureDurations, 0.95);
  const workP95 = percentile(metrics.workDurations, 0.95);
  const cadence = metrics.cadenceMs || 16.67;
  const lateFrames = metrics.frameIntervals.filter(
    (interval) => interval > cadence * 1.5,
  ).length;
  const lateFrameRatio = metrics.frameIntervals.length
    ? lateFrames / metrics.frameIntervals.length
    : 0;

  const responsivenessScore =
    normalizeLower(p95, latencyPoints) * 0.62 +
    normalizeLower(p75, latencyPoints) * 0.18 +
    normalizeLower(Math.max(50, workP95 * 3), latencyPoints) * 0.2;
  const multitaskingScore =
    normalizeLower(pressureP95, latencyPoints) * 0.7 +
    normalizeLower(metrics.recoveryMs, recoveryPoints) * 0.3;
  const smoothnessScore = ratioScore(lateFrameRatio, 0.02, 0.2);
  const videoScore =
    metrics.videoDroppedRatio == null
      ? null
      : ratioScore(metrics.videoDroppedRatio, 0.01, 0.12);
  const storageScore = normalizeLower(
    metrics.storageWriteMs,
    [
      { value: 80, score: 100 },
      { value: 250, score: 85 },
      { value: 600, score: 65 },
      { value: 1200, score: 40 },
      { value: 3000, score: 10 },
      { value: 6000, score: 0 },
    ],
  );

  const weighted = [
    [responsivenessScore, 0.32],
    [multitaskingScore, 0.28],
    [smoothnessScore, 0.14],
    [storageScore, 0.1],
    ...(videoScore == null ? [] : [[videoScore, 0.16]]),
  ];
  const totalWeight = weighted.reduce((sum, item) => sum + item[1], 0);
  let score =
    weighted.reduce((sum, item) => sum + item[0] * item[1], 0) / totalWeight;

  const ceilingReached =
    metrics.highestTierCompleted === "heavy" &&
    p95 <= Math.max(100, cadence * 3) &&
    pressureP95 <= Math.max(150, cadence * 4) &&
    lateFrameRatio <= 0.02;
  if (ceilingReached) score = Math.min(score, 97);

  const grade = gradeForScore(score);
  const workload = workloadLevel(p95, pressureP95);
  const roles = [];
  if (responsivenessScore >= 60) roles.push("Web and email");
  if (responsivenessScore >= 58 && storageScore >= 40)
    roles.push("Documents");
  if (multitaskingScore >= 60) roles.push("Light multitasking");
  if (videoScore != null && videoScore >= 60) roles.push("Streaming video");

  return {
    ...grade,
    score: Math.round(score),
    ceilingReached,
    p75,
    p95,
    pressureP95,
    workP95,
    recoveryMs: metrics.recoveryMs,
    lateFrameRatio,
    onTimeFrameRatio: 1 - lateFrameRatio,
    videoDroppedRatio: metrics.videoDroppedRatio,
    videoStalls: metrics.videoStalls,
    storageWriteMs: metrics.storageWriteMs,
    storageReadMs: metrics.storageReadMs,
    longTaskCount: metrics.longTaskCount,
    responsivenessScore: Math.round(responsivenessScore),
    multitaskingScore: Math.round(multitaskingScore),
    smoothnessScore: Math.round(smoothnessScore),
    videoScore: videoScore == null ? null : Math.round(videoScore),
    storageScore: Math.round(storageScore),
    comfortableWorkload: workload.comfortable,
    usableWorkload: workload.usable,
    roles,
  };
}

// Compatibility export for older result fixtures.
export const summarizePrototypeRun = summarizeFastRun;
