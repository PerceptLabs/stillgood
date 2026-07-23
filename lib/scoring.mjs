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

export function summarizePrototypeRun(metrics) {
  const p75 = percentile(metrics.actionDurations, 0.75);
  const p95 = percentile(metrics.actionDurations, 0.95);
  const pressureP95 = percentile(metrics.pressureDurations, 0.95);
  const cadence = metrics.cadenceMs || 16.67;
  const lateFrames = metrics.frameIntervals.filter(
    (interval) => interval > cadence * 1.5,
  ).length;
  const lateFrameRatio = metrics.frameIntervals.length
    ? lateFrames / metrics.frameIntervals.length
    : 0;

  const responsivenessScore =
    normalizeLower(p95, latencyPoints) * 0.72 +
    normalizeLower(p75, latencyPoints) * 0.18 +
    Math.max(0, 100 - lateFrameRatio * 400) * 0.1;
  const recoveryScore = normalizeLower(metrics.recoveryMs, recoveryPoints);
  const smoothnessScore = Math.max(0, 100 - lateFrameRatio * 400);
  const score =
    responsivenessScore * 0.55 +
    recoveryScore * 0.25 +
    smoothnessScore * 0.2;

  const grade = gradeForScore(score);
  const pressureRatio = p95 > 0 ? pressureP95 / p95 : 1;

  let comfortableWorkload = "One everyday task";
  let usableWorkload = "One everyday task";
  if (pressureP95 <= 200 && pressureRatio <= 2.5) {
    comfortableWorkload = "Moderate web multitasking";
    usableWorkload = "Moderate web multitasking";
  } else if (pressureP95 <= 350 && pressureRatio <= 3.5) {
    comfortableWorkload = "Light multitasking";
    usableWorkload = "Moderate web multitasking";
  } else if (pressureP95 <= 500) {
    comfortableWorkload = "One everyday task";
    usableWorkload = "Light multitasking";
  }

  const roles = [];
  if (responsivenessScore >= 60) roles.push("Web & email ready");
  if (responsivenessScore >= 55) roles.push("Basic documents");
  if (responsivenessScore >= 50) roles.push("Thin-client ready");
  if (pressureP95 <= 300 && metrics.recoveryMs <= 3000) {
    roles.push("Light multitasking");
  }

  return {
    ...grade,
    score: Math.round(score),
    responsivenessScore: Math.round(responsivenessScore),
    smoothnessScore: Math.round(smoothnessScore),
    recoveryScore: Math.round(recoveryScore),
    p75,
    p95,
    pressureP95,
    lateFrameRatio,
    onTimeFrameRatio: 1 - lateFrameRatio,
    recoveryMs: metrics.recoveryMs,
    longTaskCount: metrics.longTaskCount,
    longTaskTotalMs: metrics.longTaskTotalMs,
    comfortableWorkload,
    usableWorkload,
    roles,
  };
}
