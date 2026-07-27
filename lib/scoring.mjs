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

export function summarizeGraphicsFrames({
  drawCount,
  intervals,
  displayCadenceMs,
  elapsedMs,
}) {
  const sixtyFpsCadenceMs = 1000 / 60;
  const measuredDisplayCadence =
    Number.isFinite(displayCadenceMs) && displayCadenceMs > 0
      ? displayCadenceMs
      : sixtyFpsCadenceMs;
  const evaluationCadenceMs = Math.max(
    sixtyFpsCadenceMs,
    measuredDisplayCadence,
  );
  const expectedFrameCount = Math.max(
    1,
    Math.round(Math.max(0, elapsedMs) / evaluationCadenceMs),
  );
  const validIntervals = intervals.filter(
    (value) => Number.isFinite(value) && value >= 0,
  );
  const longFrames = validIntervals.filter((value) => value > 50).length;

  return {
    displayCadenceMs: measuredDisplayCadence,
    evaluationCadenceMs,
    expectedFrameCount,
    onTimeRatio: Math.min(1, Math.max(0, drawCount) / expectedFrameCount),
    longFrameRatio: validIntervals.length
      ? longFrames / validIntervals.length
      : 1,
    worstFrameMs: Math.max(...validIntervals, 0),
  };
}

export function qualifiesForHeadroom(samples, level = 0) {
  const durations = samples
    .map((sample) =>
      typeof sample === "number" ? sample : sample?.durationMs,
    )
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (durations.length < 3) return false;

  const policy =
    level === 0
      ? { medianMs: 450, worstMs: 1000, maximumCv: 0.35 }
      : { medianMs: 850, worstMs: 2000, maximumCv: 0.45 };
  return (
    median(durations) <= policy.medianMs &&
    Math.max(...durations) <= policy.worstMs &&
    coefficientOfVariation(durations) <= policy.maximumCv
  );
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

export function normalizeHigher(value, points) {
  const reversed = [...points].sort((a, b) => b.value - a.value);
  if (value >= reversed[0].value) return reversed[0].score;
  if (value <= reversed.at(-1).value) return reversed.at(-1).score;
  for (let index = 1; index < reversed.length; index += 1) {
    const upper = reversed[index - 1];
    const lower = reversed[index];
    if (value >= lower.value) {
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
    const actions = tier.samples.flatMap((sample) =>
      typeof sample === "number" || !Array.isArray(sample.actions)
        ? []
        : sample.actions,
    );
    const actionDurations = actions
      .map((action) => action.durationMs)
      .filter((value) => Number.isFinite(value) && value >= 0);
    const actionWork = actions
      .map((action) => action.workMs)
      .filter((value) => Number.isFinite(value) && value >= 0);
    const actionPresentation = actions
      .map((action) =>
        Number.isFinite(action.presentationMs)
          ? action.presentationMs
          : action.durationMs - action.workMs,
      )
      .filter((value) => Number.isFinite(value) && value >= 0);
    const tierMedian = median(durations);
    const worst = Math.max(...durations, 0);
    const cv = coefficientOfVariation(durations);
    const actionP95Ms = actionDurations.length
      ? percentile(actionDurations, 0.95)
      : null;
    const hitch250Ratio = actionDurations.length
      ? actionDurations.filter((value) => value > 250).length /
        actionDurations.length
      : 0;
    const hitch500Ratio = actionDurations.length
      ? actionDurations.filter((value) => value > 500).length /
        actionDurations.length
      : 0;
    let status = "limited";
    if (tier.earlyStopped) {
      status = "stopped";
    } else if (
      tierMedian <= comfortableMedian &&
      worst <= comfortableWorst &&
      cv <= 0.45 &&
      (actionP95Ms == null || (actionP95Ms <= 250 && hitch500Ratio <= 0.02))
    ) {
      status = "comfortable";
    } else if (
      tierMedian <= usableMedian &&
      worst <= usableWorst &&
      (actionP95Ms == null || actionP95Ms <= 650)
    ) {
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
    const journeyScore =
      medianScore * 0.68 +
      worstScore * 0.32 -
      (cv > 0.5 ? 12 : cv > 0.35 ? 7 : cv > 0.22 ? 3 : 0);
    const actionScore =
      actionP95Ms == null ? null : normalizeLower(actionP95Ms, latencyPoints);
    const score = tier.earlyStopped
      ? 0
      : Math.max(
          0,
          Math.round(
            actionScore == null
              ? journeyScore
              : journeyScore * 0.78 +
                  actionScore * 0.22 -
                  Math.min(10, hitch500Ratio * 80),
          ),
        );
    return {
      id: tier.id,
      label: tier.label,
      medianMs: tierMedian,
      p75Ms: percentile(durations, 0.75),
      p95Ms: percentile(durations, 0.95),
      worstMs: worst,
      cv,
      actionCount: actionDurations.length,
      actionP50Ms: actionDurations.length ? median(actionDurations) : null,
      actionP95Ms,
      actionWorkP95Ms: actionWork.length
        ? percentile(actionWork, 0.95)
        : null,
      actionPresentationP95Ms: actionPresentation.length
        ? percentile(actionPresentation, 0.95)
        : null,
      hitch250Ratio,
      hitch500Ratio,
      status,
      score,
      earlyStopped: Boolean(tier.earlyStopped),
      samples: durations,
    };
  });

  const weights = summaries.map((_, index) => index + 1);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const rawScore =
    summaries.reduce(
      (sum, summary, index) => sum + summary.score * weights[index],
      0,
    ) / weightTotal;
  const medianCv = median(summaries.map((summary) => summary.cv));
  const measuredActionTiers = summaries.filter((tier) => tier.actionCount > 0);
  const headroomTiers = summaries.filter((tier) =>
    ["headroom", "limit"].includes(tier.id),
  );
  const lastHeadroom = headroomTiers.at(-1);

  return {
    score: Math.max(0, Math.round(rawScore)),
    tiers: summaries,
    medianCv,
    actionP95Ms: measuredActionTiers.length
      ? percentile(
          measuredActionTiers.map((tier) => tier.actionP95Ms),
          0.95,
        )
      : null,
    hitch250Ratio: measuredActionTiers.length
      ? measuredActionTiers.reduce(
          (sum, tier) => sum + tier.hitch250Ratio * tier.actionCount,
          0,
        ) /
        measuredActionTiers.reduce((sum, tier) => sum + tier.actionCount, 0)
      : null,
    hitch500Ratio: measuredActionTiers.length
      ? measuredActionTiers.reduce(
          (sum, tier) => sum + tier.hitch500Ratio * tier.actionCount,
          0,
        ) /
        measuredActionTiers.reduce((sum, tier) => sum + tier.actionCount, 0)
      : null,
    highestComfortable:
      [...summaries].reverse().find((tier) => tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...summaries]
        .reverse()
        .find((tier) => ["comfortable", "usable"].includes(tier.status))
        ?.label ?? "None",
    testedHeadroom: headroomTiers.length > 0,
    headroomCeiling:
      lastHeadroom?.id === "limit" &&
      ["comfortable", "usable"].includes(lastHeadroom.status),
    limitFound:
      headroomTiers.length > 0 &&
      ["limited", "failed", "stopped"].includes(lastHeadroom?.status),
  };
}

function summarizeGraphics(tiers) {
  const summaries = tiers.map((tier) => {
    const valid =
      tier.valid === true ||
      (tier.valid !== false &&
        (tier.earlyStopped || tier.frameCount == null || tier.frameCount >= 8));
    if (!valid) return { ...tier, valid: false, status: "invalid" };
    const onTimeScore = normalizeHigher(tier.onTimeRatio, [
      { value: 0.99, score: 100 },
      { value: 0.95, score: 90 },
      { value: 0.85, score: 68 },
      { value: 0.65, score: 32 },
      { value: 0.45, score: 0 },
    ]);
    const longFrameScore = normalizeLower(tier.longFrameRatio, [
      { value: 0, score: 100 },
      { value: 0.03, score: 90 },
      { value: 0.12, score: 68 },
      { value: 0.25, score: 32 },
      { value: 0.45, score: 0 },
    ]);
    const worstFrameScore = normalizeLower(
      Number.isFinite(tier.worstFrameMs) ? tier.worstFrameMs : 16.67,
      [
        { value: 20, score: 100 },
        { value: 33, score: 90 },
        { value: 50, score: 76 },
        { value: 100, score: 50 },
        { value: 250, score: 20 },
        { value: 500, score: 0 },
      ],
    );
    const score = Math.round(
      onTimeScore * 0.6 + longFrameScore * 0.25 + worstFrameScore * 0.15,
    );
    const status =
      score >= 85
        ? "comfortable"
        : score >= 65
          ? "usable"
          : score >= 40
            ? "limited"
            : "failed";
    return { ...tier, valid: true, status, score };
  });
  const weights = [0.15, 0.25, 0.4, 0.2];
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
              sum + (tier.valid ? tier.score * weights[index] : 0),
            0,
          ) / validWeight,
        )
      : 0,
    tiers: summaries,
    available: validWeight > 0,
    invalidTierCount,
    everydayScore: Math.round(
      summaries
        .slice(0, 3)
        .reduce(
          (sum, tier, index) =>
            sum + (tier.valid ? tier.score * [0.2, 0.3, 0.5][index] : 0),
          0,
        ),
    ),
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

export function summarizeResponsivenessConsistency({
  tierGroups,
  longAnimationFrameDurations = [],
  longAnimationFrameCount = 0,
  activeMs = 0,
}) {
  const actions = tierGroups.flatMap((tiers) =>
    tiers.flatMap((tier) =>
      tier.samples.flatMap((sample) =>
        typeof sample === "number" || !Array.isArray(sample.actions)
          ? []
          : sample.actions,
      ),
    ),
  );
  const durations = actions
    .map((action) => action.durationMs)
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (!durations.length) {
    return {
      available: false,
      score: null,
      label: "Not measured",
      actionCount: 0,
      p50Ms: null,
      p75Ms: null,
      p95Ms: null,
      p99Ms: null,
      worstMs: null,
      hitch250Ratio: null,
      hitch500Ratio: null,
      longFrameRatePerMinute: null,
      blockingBurdenRatio: null,
    };
  }

  const p95Ms = percentile(durations, 0.95);
  const hitch250Ratio =
    durations.filter((value) => value > 250).length / durations.length;
  const hitch500Ratio =
    durations.filter((value) => value > 500).length / durations.length;
  const actionScore = normalizeLower(p95Ms, latencyPoints);
  const hitchPenalty = Math.min(
    30,
    hitch250Ratio * 55 + hitch500Ratio * 120,
  );
  const validLongFrames = longAnimationFrameDurations.filter(
    (value) => Number.isFinite(value) && value >= 50,
  );
  const observedLongFrameCount = Math.max(
    validLongFrames.length,
    Number.isFinite(longAnimationFrameCount) ? longAnimationFrameCount : 0,
  );
  const longFrameRatePerMinute =
    activeMs > 0 ? observedLongFrameCount / (activeMs / 60000) : null;
  const longFrameScore =
    longFrameRatePerMinute == null || observedLongFrameCount === 0
      ? null
      : normalizeLower(longFrameRatePerMinute, [
          { value: 60, score: 100 },
          { value: 120, score: 92 },
          { value: 180, score: 75 },
          { value: 240, score: 55 },
          { value: 320, score: 25 },
          { value: 450, score: 0 },
        ]);
  const score = Math.max(
    0,
    Math.round(
      (longFrameScore == null
        ? actionScore
        : actionScore * 0.65 + longFrameScore * 0.35) - hitchPenalty,
    ),
  );
  const label =
    score >= 84
      ? "Steady"
      : score >= 72
        ? "Occasional pauses"
        : score >= 48
          ? "Noticeable hitches"
          : "Frequent interruptions";
  const blockingMs = validLongFrames.reduce(
    (sum, value) => sum + Math.max(0, value - 50),
    0,
  );

  return {
    available: true,
    score,
    label,
    actionCount: durations.length,
    p50Ms: median(durations),
    p75Ms: percentile(durations, 0.75),
    p95Ms,
    p99Ms: percentile(durations, 0.99),
    worstMs: Math.max(...durations),
    hitch250Ratio,
    hitch500Ratio,
    longFrameRatePerMinute,
    blockingBurdenRatio: activeMs > 0 ? blockingMs / activeMs : null,
  };
}

function summarizeHeadroom(categories, multitasking, graphics) {
  const categoryEvidence = categories.map((category) => {
    const headroomTiers = category.tiers.filter((tier) =>
      ["headroom", "limit"].includes(tier.id),
    );
    if (category.headroomCeiling) return 100;
    if (headroomTiers.length) return headroomTiers.at(-1).score;
    return Math.min(72, category.score * 0.78);
  });
  const score = Math.round(
    median(categoryEvidence) * 0.7 +
      multitasking.score * 0.2 +
      (graphics.everydayScore ?? graphics.score) * 0.1,
  );
  return {
    score,
    label:
      score >= 88
        ? "Very high"
        : score >= 72
          ? "High"
          : score >= 54
            ? "Moderate"
            : "Limited",
    openCeilings: categories.filter((category) => category.headroomCeiling)
      .length,
    extendedCategories: categories.filter((category) => category.testedHeadroom)
      .length,
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
  const responsiveness = summarizeResponsivenessConsistency({
    tierGroups: [
      metrics.browsingTiers,
      metrics.emailTiers,
      metrics.writingTiers,
      metrics.spreadsheetTiers,
      metrics.multitaskTiers,
    ],
    longAnimationFrameDurations:
      metrics.longAnimationFrameDurations ?? [],
    longAnimationFrameCount: metrics.longAnimationFrameCount ?? 0,
    activeMs: metrics.measuredActiveMs ?? 0,
  });
  const headroom = summarizeHeadroom(
    [browsing, email, writing, spreadsheets],
    multitasking,
    graphics,
  );

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
  if (responsiveness.available)
    scoredCategories.push({ score: responsiveness.score, weight: 0.08 });
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
    metrics.baselineUnsettled ||
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
    (!responsiveness.available || responsiveness.score >= 90) &&
    invalidMeasurementCount === 0 &&
    variability <= 0.12;
  if (ceilingReached) score = Math.min(score, 98);
  if (invalidMeasurementCount > 0) score = Math.min(score, 91);
  if (graphics.available && graphics.everydayScore < 76)
    score = Math.min(score, 83);
  if (video.available && video.score < 76) score = Math.min(score, 83);
  if (graphics.available && graphics.everydayScore < 68)
    score = Math.min(score, 75);
  if (video.available && video.score < 68) score = Math.min(score, 75);
  if (graphics.available && graphics.everydayScore < 58)
    score = Math.min(score, 67);
  if (video.available && video.score < 58) score = Math.min(score, 67);
  if (responsiveness.available && responsiveness.score < 72)
    score = Math.min(score, 83);
  if (responsiveness.available && responsiveness.score < 58)
    score = Math.min(score, 75);
  if (responsiveness.available && responsiveness.score < 42)
    score = Math.min(score, 67);

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
  if (metrics.baselineUnsettled)
    integrityNotes.push(
      "Background activity was already delaying the browser before the test. Retest after the computer settles for a cleaner comparison.",
    );
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
    responsiveness,
    headroom,
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
