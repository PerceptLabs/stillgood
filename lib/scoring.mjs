export const latencyPoints = [
  { value: 80, score: 100 },
  { value: 150, score: 90 },
  { value: 250, score: 76 },
  { value: 400, score: 60 },
  { value: 650, score: 42 },
  { value: 1000, score: 25 },
  { value: 1800, score: 8 },
  { value: 3000, score: 0 },
];

export const recoveryPoints = [
  { value: 250, score: 100 },
  { value: 750, score: 90 },
  { value: 1500, score: 76 },
  { value: 3000, score: 56 },
  { value: 6000, score: 30 },
  { value: 12000, score: 8 },
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

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function coefficientOfVariation(values) {
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (!average) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;
  return Math.sqrt(variance) / average;
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
  if (score >= 92) return { grade: "A+", label: "Modern-fast" };
  if (score >= 84) return { grade: "A", label: "Comfortable" };
  if (score >= 76) return { grade: "B+", label: "Strong second-life" };
  if (score >= 68) return { grade: "B", label: "Useful" };
  if (score >= 58) return { grade: "C+", label: "Light-use" };
  if (score >= 48) return { grade: "C", label: "Focused-use" };
  if (score >= 35) return { grade: "D", label: "Single-purpose" };
  return { grade: "E", label: "Struggling" };
}

const tierWeights = [0.1, 0.15, 0.2, 0.25, 0.3];

function statusValue(status) {
  if (status === "comfortable") return 100;
  if (status === "usable") return 68;
  if (status === "limited") return 32;
  return 0;
}

function continuousLatencyScore(value, comfortable, usable, failed) {
  return normalizeLower(value, [
    { value: Math.max(1, comfortable * 0.35), score: 100 },
    { value: comfortable, score: 86 },
    { value: usable, score: 62 },
    { value: failed, score: 26 },
    { value: failed * 2, score: 0 },
  ]);
}

export function summarizeLatencyTiers(tiers, thresholds = {}) {
  const comfortableMedian = thresholds.comfortableMedian ?? 200;
  const comfortableWorst = thresholds.comfortableWorst ?? 500;
  const usableMedian = thresholds.usableMedian ?? 500;
  const usableWorst = thresholds.usableWorst ?? 1200;

  const summaries = tiers.map((tier) => {
    const durations = tier.samples.map((sample) =>
      typeof sample === "number" ? sample : sample.durationMs,
    );
    const tierMedian = median(durations);
    const worst = Math.max(...durations, 0);
    const cv = coefficientOfVariation(durations);
    let status = "limited";
    if (tier.earlyStopped) {
      status = "stopped";
    } else if (
      tierMedian <= comfortableMedian &&
      worst <= comfortableWorst &&
      cv <= 0.45
    ) {
      status = "comfortable";
    } else if (tierMedian <= usableMedian && worst <= usableWorst) {
      status = "usable";
    } else if (tierMedian > usableWorst || worst > usableWorst * 2) {
      status = "failed";
    }
    const medianScore = continuousLatencyScore(
      tierMedian,
      comfortableMedian,
      usableMedian,
      usableWorst,
    );
    const worstScore = continuousLatencyScore(
      worst,
      comfortableWorst,
      usableWorst,
      usableWorst * 2,
    );
    const score = tier.earlyStopped
      ? 0
      : Math.max(
          0,
          Math.round(
            medianScore * 0.68 +
              worstScore * 0.32 -
              (cv > 0.5 ? 12 : cv > 0.35 ? 7 : cv > 0.22 ? 3 : 0),
          ),
        );
    return {
      id: tier.id,
      label: tier.label,
      medianMs: tierMedian,
      p75Ms: percentile(durations, 0.75),
      worstMs: worst,
      cv,
      status,
      score,
      earlyStopped: Boolean(tier.earlyStopped),
      samples: durations,
    };
  });

  const weights = summaries.map(
    (_, index) => tierWeights[index] ?? 1 / summaries.length,
  );
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const rawScore =
    summaries.reduce(
      (sum, summary, index) => sum + summary.score * weights[index],
      0,
    ) / weightTotal;
  const medianCv = median(summaries.map((summary) => summary.cv));

  return {
    score: Math.max(0, Math.round(rawScore)),
    tiers: summaries,
    medianCv,
    highestComfortable:
      [...summaries].reverse().find((tier) => tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...summaries]
        .reverse()
        .find((tier) => ["comfortable", "usable"].includes(tier.status))
        ?.label ?? "None",
  };
}

function summarizeGraphics(tiers) {
  const summaries = tiers.map((tier) => {
    const valid =
      tier.valid === true ||
      (tier.valid !== false &&
        (tier.earlyStopped || tier.frameCount == null || tier.frameCount >= 8));
    if (!valid) return { ...tier, valid: false, status: "invalid" };
    let status = "failed";
    if (tier.onTimeRatio >= 0.95 && tier.longFrameRatio <= 0.03) {
      status = "comfortable";
    } else if (tier.onTimeRatio >= 0.85 && tier.longFrameRatio <= 0.12) {
      status = "usable";
    } else if (tier.onTimeRatio >= 0.65) {
      status = "limited";
    }
    return { ...tier, valid: true, status };
  });
  const weights = [0.15, 0.2, 0.28, 0.37];
  const validWeight = summaries.reduce(
    (sum, tier, index) => sum + (tier.valid ? weights[index] : 0),
    0,
  );
  const invalidTierCount = summaries.filter((tier) => !tier.valid).length;
  return {
    score: validWeight
      ? Math.round(
          summaries.reduce(
            (sum, tier, index) =>
              sum + (tier.valid ? statusValue(tier.status) * weights[index] : 0),
            0,
          ) / validWeight,
        )
      : 0,
    tiers: summaries,
    available: validWeight > 0,
    invalidTierCount,
    highestComfortable:
      [...summaries]
        .reverse()
        .find((tier) => tier.valid && tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...summaries]
        .reverse()
        .find(
          (tier) =>
            tier.valid && ["comfortable", "usable"].includes(tier.status),
        )
        ?.label ?? "None",
  };
}

function summarizeVideo(tiers) {
  const summaries = tiers.map((tier) => {
    const valid =
      tier.valid !== false &&
      (tier.totalFrames == null || tier.totalFrames > 0);
    if (!valid) return { ...tier, valid: false, status: "invalid" };
    let status = "failed";
    if (tier.completed && tier.droppedRatio <= 0.01 && tier.stalls === 0) {
      status = "comfortable";
    } else if (
      tier.completed &&
      tier.droppedRatio <= 0.05 &&
      tier.stalls <= 1
    ) {
      status = "usable";
    } else if (tier.completed && tier.droppedRatio <= 0.12) {
      status = "limited";
    }
    return { ...tier, valid: true, status };
  });
  const weights = [0.2, 0.32, 0.48];
  const validWeight = summaries.reduce(
    (sum, tier, index) => sum + (tier.valid ? weights[index] : 0),
    0,
  );
  const invalidTierCount = summaries.filter((tier) => !tier.valid).length;
  return {
    score: validWeight
      ? Math.round(
          summaries.reduce(
            (sum, tier, index) =>
              sum + (tier.valid ? statusValue(tier.status) * weights[index] : 0),
            0,
          ) / validWeight,
        )
      : 0,
    tiers: summaries,
    available: validWeight > 0,
    invalidTierCount,
    highestComfortable:
      [...summaries]
        .reverse()
        .find((tier) => tier.valid && tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...summaries]
        .reverse()
        .find(
          (tier) =>
            tier.valid && ["comfortable", "usable"].includes(tier.status),
        )
        ?.label ?? "None",
  };
}

function summarizeStorage(tiers) {
  const comfortable = [180, 650, 1800];
  const usable = [600, 1800, 5000];
  const summaries = tiers.map((tier, index) => {
    const total = tier.writeMs + tier.readMs;
    const status =
      total <= comfortable[index]
        ? "comfortable"
        : total <= usable[index]
          ? "usable"
          : total <= usable[index] * 2
            ? "limited"
            : "failed";
    return { ...tier, totalMs: total, status };
  });
  const weights = [0.2, 0.3, 0.5];
  return {
    score: Math.round(
      summaries.reduce(
        (sum, tier, index) => sum + statusValue(tier.status) * weights[index],
        0,
      ),
    ),
    tiers: summaries,
  };
}

function weightedGeometricMean(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  return Math.exp(
    items.reduce(
      (sum, item) =>
        sum + item.weight * Math.log(Math.max(3, item.score)),
      0,
    ) / totalWeight,
  );
}

export function summarizeThoroughRun(metrics) {
  const browsing = summarizeLatencyTiers(metrics.browsingTiers, {
    comfortableMedian: 260,
    comfortableWorst: 700,
    usableMedian: 650,
    usableWorst: 1700,
  });
  const email = summarizeLatencyTiers(metrics.emailTiers, {
    comfortableMedian: 260,
    comfortableWorst: 700,
    usableMedian: 650,
    usableWorst: 1700,
  });
  const writing = summarizeLatencyTiers(metrics.writingTiers, {
    comfortableMedian: 320,
    comfortableWorst: 900,
    usableMedian: 850,
    usableWorst: 2200,
  });
  const spreadsheets = summarizeLatencyTiers(metrics.spreadsheetTiers, {
    comfortableMedian: 300,
    comfortableWorst: 850,
    usableMedian: 800,
    usableWorst: 2200,
  });
  const multitasking = summarizeLatencyTiers(metrics.multitaskTiers, {
    comfortableMedian: 260,
    comfortableWorst: 650,
    usableMedian: 650,
    usableWorst: 1600,
  });
  const graphics = summarizeGraphics(metrics.graphicsTiers);
  const video = summarizeVideo(metrics.videoTiers);
  const storage = summarizeStorage(metrics.storageTiers);
  const recoveryScore = normalizeLower(metrics.recoveryMs, recoveryPoints);

  const scoredCategories = [
    { score: browsing.score, weight: 0.22 },
    { score: email.score, weight: 0.09 },
    { score: writing.score, weight: 0.09 },
    { score: spreadsheets.score, weight: 0.1 },
    { score: multitasking.score, weight: 0.17 },
    { score: storage.score, weight: 0.03 },
    { score: recoveryScore, weight: 0.05 },
  ];
  if (graphics.available)
    scoredCategories.push({ score: graphics.score, weight: 0.13 });
  if (video.available)
    scoredCategories.push({ score: video.score, weight: 0.12 });
  let score = weightedGeometricMean(scoredCategories);

  const coreMinimum = Math.min(
    browsing.score,
    email.score,
    writing.score,
    spreadsheets.score,
    multitasking.score,
  );
  if (coreMinimum < 35) score = Math.min(score, 47);
  else if (coreMinimum < 50) score = Math.min(score, 57);
  else if (coreMinimum < 65) score = Math.min(score, 67);
  else if (coreMinimum < 76) score = Math.min(score, 75);
  else if (coreMinimum < 86) score = Math.min(score, 83);

  const variability = median([
    browsing.medianCv,
    email.medianCv,
    writing.medianCv,
    spreadsheets.medianCv,
    multitasking.medianCv,
  ]);
  const invalidMeasurementCount =
    graphics.invalidTierCount + video.invalidTierCount;
  const confidence =
    metrics.interruptionCount > 0 ||
    variability > 0.45 ||
    !graphics.available ||
    !video.available
      ? "Low"
      : variability > 0.25 ||
          invalidMeasurementCount > 0
        ? "Medium"
        : "High";

  const ceilingReached =
    coreMinimum >= 96 &&
    browsing.score >= 96 &&
    graphics.score >= 95 &&
    video.score >= 95 &&
    invalidMeasurementCount === 0 &&
    variability <= 0.12;
  if (ceilingReached) score = Math.min(score, 98);
  if (invalidMeasurementCount > 0) score = Math.min(score, 91);
  if (graphics.available && graphics.score < 76) score = Math.min(score, 83);
  if (video.available && video.score < 76) score = Math.min(score, 83);
  if (graphics.available && graphics.score < 68) score = Math.min(score, 75);
  if (video.available && video.score < 68) score = Math.min(score, 75);
  if (graphics.available && graphics.score < 58) score = Math.min(score, 67);
  if (video.available && video.score < 58) score = Math.min(score, 67);

  score = Math.round(score);
  const grade = gradeForScore(score);
  const integrityNotes = [];
  if (graphics.invalidTierCount)
    integrityNotes.push(
      `${graphics.invalidTierCount} visual tier${graphics.invalidTierCount === 1 ? "" : "s"} did not produce enough measurable frames.`,
    );
  if (video.invalidTierCount)
    integrityNotes.push(
      `${video.invalidTierCount} video tier${video.invalidTierCount === 1 ? "" : "s"} did not produce a valid frame count and was excluded.`,
    );
  if (!video.available)
    integrityNotes.push("Video capability could not be verified in this browser.");
  if (metrics.interruptionCount > 0)
    integrityNotes.push("The test tab was hidden or interrupted during the run.");
  const roles = [];
  if (browsing.score >= 58) roles.push("Web browsing");
  if (email.score >= 58) roles.push("Email and webmail");
  if (writing.score >= 58) roles.push("Writing and documents");
  if (spreadsheets.score >= 58) roles.push("Spreadsheets");
  if (multitasking.highestComfortable !== "None")
    roles.push("Light multitasking");
  if (["Demanding", "Extreme"].includes(multitasking.highestComfortable))
    roles.push("Heavy web multitasking");
  if (video.highestUsable !== "None")
    roles.push(`H.264 video up to ${video.highestUsable}`);
  roles.push("Remote access");

  return {
    ...grade,
    score,
    ceilingReached,
    confidence,
    variability,
    browsing,
    email,
    writing,
    spreadsheets,
    multitasking,
    graphics,
    video,
    storage,
    recoveryMs: metrics.recoveryMs,
    recoveryScore: Math.round(recoveryScore),
    longTaskCount: metrics.longTaskCount,
    longAnimationFrameCount: metrics.longAnimationFrameCount,
    interruptionCount: metrics.interruptionCount,
    integrityNotes,
    roles,
  };
}

// Kept for old exported-result readers.
export const summarizeFastRun = summarizeThoroughRun;
export const summarizePrototypeRun = summarizeThoroughRun;
