import {
  browserEvidenceProfile,
  browserSupportStatus,
} from "./browser-evidence-policy.mjs";

export const latencyPoints = [
  { value: 30, score: 100 },
  { value: 50, score: 97 },
  { value: 80, score: 93 },
  { value: 120, score: 88 },
  { value: 180, score: 80 },
  { value: 250, score: 72 },
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

const headroomTierIds = new Set(["headroom", "limit"]);
const nonEverydayTierIds = new Set(["headroom", "limit", "reserve"]);

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
  if (score >= 99) return { grade: "A+", label: "Exceptional reserve" };
  if (score >= 97) return { grade: "A", label: "Deep reserve" };
  if (score >= 94) return { grade: "A-", label: "Fast everyday" };
  if (score >= 90) return { grade: "B+", label: "Strong second-life" };
  if (score >= 85) return { grade: "B", label: "Comfortable second-life" };
  if (score >= 80) return { grade: "B-", label: "Useful second-life" };
  if (score >= 74) return { grade: "C+", label: "Capable light-use" };
  if (score >= 68) return { grade: "C", label: "Light-use" };
  if (score >= 58) return { grade: "C-", label: "Focused-use" };
  if (score >= 45) return { grade: "D", label: "Single-purpose" };
  return { grade: "E", label: "Struggling" };
}

/**
 * Keep the familiar 0-100 public scale while reserving its last few points for
 * genuinely exceptional evidence. Scores through 85 are unchanged. Above 85,
 * the hidden 0-1000 result is calibrated through explicit anchors so a strong
 * older workstation does not appear indistinguishable from a substantially
 * faster current system. The raw evidence matrix remains available separately.
 */
export function calibrateTopEndScore1000(score1000) {
  const normalized = Math.max(
    0,
    Math.min(1000, Number.isFinite(score1000) ? Math.round(score1000) : 0),
  );
  if (normalized <= 850) return normalized;
  const anchors = [
    { input: 850, output: 850 },
    { input: 900, output: 880 },
    { input: 950, output: 920 },
    { input: 970, output: 950 },
    { input: 985, output: 980 },
    { input: 995, output: 992 },
    { input: 1000, output: 1000 },
  ];
  for (let index = 1; index < anchors.length; index += 1) {
    const lower = anchors[index - 1];
    const upper = anchors[index];
    if (normalized <= upper.input) {
      const progress =
        (normalized - lower.input) / (upper.input - lower.input);
      return Math.round(
        lower.output + progress * (upper.output - lower.output),
      );
    }
  }
  return 1000;
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
}

function toScore1000(score) {
  return Math.round(clampScore(score) * 10);
}

function preciseScore(category) {
  return Number.isFinite(category?.score1000)
    ? category.score1000 / 10
    : clampScore(category?.score);
}

function continuousLatencyScore(value, comfortable, usable, failed) {
  return normalizeLower(value, [
    { value: Math.max(1, comfortable * 0.12), score: 100 },
    { value: comfortable * 0.25, score: 96 },
    { value: comfortable * 0.4, score: 91 },
    { value: comfortable * 0.65, score: 84 },
    { value: comfortable, score: 76 },
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
    const scoreExact = tier.earlyStopped
      ? 0
      : Math.max(
          0,
          actionScore == null
            ? journeyScore
            : journeyScore * 0.78 +
                actionScore * 0.22 -
                Math.min(10, hitch500Ratio * 80),
        );
    const score = Math.round(scoreExact);
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
      score1000: toScore1000(scoreExact),
      earlyStopped: Boolean(tier.earlyStopped),
      samples: durations,
    };
  });

  const baseSummaries = summaries.filter((tier) => tier.id !== "reserve");
  const everydaySummaries = summaries.filter(
    (tier) => !nonEverydayTierIds.has(tier.id),
  );
  const practicalWeights = [0.24, 0.23, 0.21, 0.18, 0.14];
  const everydayWeights = everydaySummaries.map(
    (_, index) => practicalWeights[index] ?? 0.1,
  );
  const everydayWeightTotal = everydayWeights.reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const everydayScore = everydayWeightTotal
    ? everydaySummaries.reduce(
        (sum, summary, index) =>
          sum + (summary.score1000 / 10) * everydayWeights[index],
        0,
      ) / everydayWeightTotal
    : 0;
  const capacitySummaries = summaries.filter((tier) =>
    headroomTierIds.has(tier.id),
  );
  const capacityWeights = capacitySummaries.map((_, index) =>
    index === capacitySummaries.length - 1 ? 0.6 : 0.4,
  );
  const capacityWeightTotal = capacityWeights.reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const capacityScore = capacityWeightTotal
    ? capacitySummaries.reduce(
        (sum, summary, index) =>
          sum + (summary.score1000 / 10) * capacityWeights[index],
        0,
      ) / capacityWeightTotal
    : everydayScore;
  const rawScore = everydayScore * 0.78 + capacityScore * 0.22;
  const medianCv = median(baseSummaries.map((summary) => summary.cv));
  const measuredActionTiers = baseSummaries.filter(
    (tier) => tier.actionCount > 0,
  );
  const headroomTiers = summaries.filter((tier) =>
    headroomTierIds.has(tier.id),
  );
  const lastHeadroom = headroomTiers.at(-1);

  return {
    score: Math.max(0, Math.round(rawScore)),
    score1000: toScore1000(rawScore),
    everydayScore: Math.max(0, Math.round(everydayScore)),
    everydayScore1000: toScore1000(everydayScore),
    capacityScore: Math.max(0, Math.round(capacityScore)),
    capacityScore1000: toScore1000(capacityScore),
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
      [...baseSummaries].reverse().find((tier) => tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...baseSummaries]
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
    const scoreExact =
      onTimeScore * 0.6 + longFrameScore * 0.25 + worstFrameScore * 0.15;
    const score = Math.round(scoreExact);
    const status =
      score >= 85
        ? "comfortable"
        : score >= 65
          ? "usable"
          : score >= 40
            ? "limited"
            : "failed";
    return {
      ...tier,
      valid: true,
      status,
      score,
      score1000: toScore1000(scoreExact),
    };
  });
  const baseSummaries = summaries.filter((tier) => tier.id !== "reserve");
  const weights = [0.15, 0.25, 0.4, 0.2];
  const validWeight = baseSummaries.reduce(
    (sum, tier, index) => sum + (tier.valid ? weights[index] : 0),
    0,
  );
  const invalidTierCount = baseSummaries.filter((tier) => !tier.valid).length;
  const scoreExact = validWeight
    ? baseSummaries.reduce(
        (sum, tier, index) =>
          sum + (tier.valid ? (tier.score1000 / 10) * weights[index] : 0),
        0,
      ) / validWeight
    : 0;
  const everydayScoreExact = baseSummaries
    .slice(0, 3)
    .reduce(
      (sum, tier, index) =>
        sum + (tier.valid ? (tier.score1000 / 10) * [0.2, 0.3, 0.5][index] : 0),
      0,
    );
  return {
    score: Math.round(scoreExact),
    score1000: toScore1000(scoreExact),
    tiers: summaries,
    available: validWeight > 0,
    invalidTierCount,
    everydayScore: Math.round(everydayScoreExact),
    everydayScore1000: toScore1000(everydayScoreExact),
    highestComfortable:
      [...baseSummaries]
        .reverse()
        .find((tier) => tier.valid && tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...baseSummaries]
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
      score1000: null,
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
  const scoreExact = Math.max(
    0,
    (longFrameScore == null
      ? actionScore
      : actionScore * 0.65 + longFrameScore * 0.35) - hitchPenalty,
  );
  const score = Math.round(scoreExact);
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
    score1000: toScore1000(scoreExact),
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

function headroomLabelForScore(score) {
  return score >= 90
    ? "Very high"
    : score >= 78
      ? "High"
      : score >= 54
        ? "Moderate"
        : "Limited";
}

export function summarizeHeadroom(categories, multitasking, graphics) {
  const categoryEvidence = categories.map((category) => {
    const headroomTiers = category.tiers.filter((tier) =>
      headroomTierIds.has(tier.id),
    );
    if (headroomTiers.length) {
      const lastMeasured = headroomTiers.at(-1);
      return lastMeasured.status === "comfortable"
        ? Math.min(100, (lastMeasured.score1000 ?? lastMeasured.score * 10) / 10 + 2)
        : (lastMeasured.score1000 ?? lastMeasured.score * 10) / 10;
    }
    return Math.min(72, preciseScore(category) * 0.78);
  });
  const evidence = [
    { score: median(categoryEvidence), weight: 0.7 },
    { score: preciseScore(multitasking), weight: 0.2 },
    {
      score: Number.isFinite(graphics.everydayScore1000)
        ? graphics.everydayScore1000 / 10
        : preciseScore(graphics),
      weight: 0.1,
      available: graphics.available !== false,
    },
  ].filter(
    (item) =>
      item.available !== false &&
      Number.isFinite(item.score),
  );
  const totalWeight = evidence.reduce((sum, item) => sum + item.weight, 0);
  const scoreExact =
    evidence.reduce((sum, item) => sum + item.score * item.weight, 0) /
    totalWeight;
  const score = Math.round(scoreExact);
  return {
    score,
    score1000: toScore1000(scoreExact),
    label: headroomLabelForScore(score),
    openCeilings: categories.filter((category) => category.headroomCeiling)
      .length,
    extendedCategories: categories.filter((category) => category.testedHeadroom)
      .length,
  };
}

export function summarizeVideo(tiers) {
  const summaries = tiers.map((tier) => {
    if (tier.skipped) return { ...tier, valid: false, status: "skipped" };
    const valid =
      tier.valid !== false &&
      (tier.totalFrames == null || tier.totalFrames > 0);
    if (!valid) return { ...tier, valid: false, status: "invalid" };
    const stallDurationMs = Number.isFinite(tier.stallDurationMs)
      ? Math.max(0, tier.stallDurationMs)
      : tier.stalls > 0
        ? tier.stalls * 350
        : 0;
    const longestStallMs = Number.isFinite(tier.longestStallMs)
      ? Math.max(0, tier.longestStallMs)
      : tier.stalls > 0
        ? 350
        : 0;
    let status = "failed";
    if (
      tier.completed &&
      tier.droppedRatio <= 0.01 &&
      stallDurationMs <= 100 &&
      longestStallMs <= 100
    ) {
      status = "comfortable";
    } else if (
      tier.completed &&
      tier.droppedRatio <= 0.05 &&
      stallDurationMs <= 500 &&
      longestStallMs <= 350
    ) {
      status = "usable";
    } else if (
      tier.completed &&
      tier.droppedRatio <= 0.12 &&
      stallDurationMs <= 1500 &&
      longestStallMs <= 1000
    ) {
      status = "limited";
    }
    const droppedScore = normalizeLower(Math.max(0, tier.droppedRatio ?? 1), [
      { value: 0, score: 100 },
      { value: 0.002, score: 99 },
      { value: 0.01, score: 95 },
      { value: 0.03, score: 84 },
      { value: 0.05, score: 72 },
      { value: 0.12, score: 40 },
      { value: 0.25, score: 0 },
    ]);
    const stallScore = normalizeLower(stallDurationMs, [
      { value: 0, score: 100 },
      { value: 50, score: 98 },
      { value: 100, score: 95 },
      { value: 500, score: 72 },
      { value: 1500, score: 40 },
      { value: 3000, score: 0 },
    ]);
    const longestStallScore = normalizeLower(longestStallMs, [
      { value: 0, score: 100 },
      { value: 50, score: 98 },
      { value: 100, score: 95 },
      { value: 350, score: 72 },
      { value: 1000, score: 40 },
      { value: 2000, score: 0 },
    ]);
    const playbackScore =
      droppedScore * 0.6 + stallScore * 0.25 + longestStallScore * 0.15;
    const scoreExact = tier.completed ? playbackScore : Math.min(40, playbackScore);
    return {
      ...tier,
      stallDurationMs,
      longestStallMs,
      valid: true,
      status,
      score: Math.round(scoreExact),
      score1000: toScore1000(scoreExact),
    };
  });
  const everydaySummaries = summaries.filter((tier) => !tier.headroom);
  const weights = [0.2, 0.32, 0.48];
  const validWeight = everydaySummaries.reduce(
    (sum, tier, index) => sum + (tier.valid ? weights[index] : 0),
    0,
  );
  const invalidTierCount = everydaySummaries.filter((tier) => !tier.valid).length;
  const testedHeadroom = summaries.some(
    (tier) => tier.headroom && !tier.skipped,
  );
  const comfortable4k = summaries.some(
    (tier) =>
      tier.id === "4k" && tier.valid && tier.status === "comfortable",
  );
  const scoreExact = validWeight
    ? everydaySummaries.reduce(
        (sum, tier, index) =>
          sum + (tier.valid ? (tier.score1000 / 10) * weights[index] : 0),
        0,
      ) / validWeight
    : 0;
  return {
    score: Math.round(scoreExact),
    score1000: toScore1000(scoreExact),
    tiers: summaries,
    available: validWeight > 0,
    invalidTierCount,
    testedHeadroom,
    headroomCeiling: comfortable4k,
    limitFound:
      testedHeadroom &&
      summaries.some(
        (tier) =>
          tier.headroom &&
          !tier.skipped &&
          (!tier.valid || tier.status !== "comfortable"),
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

function statusForScore(score) {
  if (score >= 86) return "comfortable";
  if (score >= 62) return "usable";
  if (score >= 30) return "limited";
  return "failed";
}

function reportedMemoryLabel(reportedMemoryGB) {
  if (reportedMemoryGB === 2) return "2 GB class";
  if (reportedMemoryGB === 4) return "4 GB class";
  if (reportedMemoryGB === 8) return "8 GB or more";
  return "Not available; measured behavior used";
}

export function summarizeMemory(
  tiers = [],
  supported,
  reportedMemoryGB = null,
  { capacityProbeCapped = false } = {},
) {
  const validTiers = tiers.filter(
    (tier) =>
      Number.isFinite(tier.probeP95Ms) &&
      Number.isFinite(tier.probeWorstMs) &&
      Number.isFinite(tier.copyRoundTripMs),
  );
  const summaries = validTiers.map((tier) => {
    const copyOverheadMs = Math.max(
      0,
      tier.copyRoundTripMs -
        (tier.allocationMs ?? 0) -
        (tier.scanMs ?? 0) -
        (tier.gcChurnMs ?? 0),
    );
    const foregroundScore =
      normalizeLower(tier.probeP95Ms, [
        { value: 2, score: 100 },
        { value: 10, score: 96 },
        { value: 25, score: 88 },
        { value: 60, score: 70 },
        { value: 150, score: 45 },
        { value: 350, score: 20 },
        { value: 800, score: 0 },
      ]) *
        0.6875 +
      normalizeLower(tier.probeWorstMs, [
        { value: 10, score: 100 },
        { value: 50, score: 92 },
        { value: 120, score: 80 },
        { value: 300, score: 55 },
        { value: 800, score: 25 },
        { value: 1600, score: 0 },
      ]) *
        0.3125;
    const copyScore = normalizeLower(copyOverheadMs, [
      { value: 80, score: 100 },
      { value: 180, score: 90 },
      { value: 400, score: 72 },
      { value: 900, score: 48 },
      { value: 2000, score: 20 },
      { value: 5000, score: 0 },
    ]);
    const sweepScore = Number.isFinite(tier.sweepMBps)
      ? normalizeHigher(tier.sweepMBps, [
          { value: 6000, score: 100 },
          { value: 3000, score: 90 },
          { value: 1500, score: 75 },
          { value: 800, score: 55 },
          { value: 300, score: 25 },
          { value: 100, score: 0 },
        ])
      : null;
    const gcPer100kMs =
      Number.isFinite(tier.gcChurnMs) && tier.gcObjectsCreated > 0
        ? (tier.gcChurnMs / tier.gcObjectsCreated) * 100000
        : null;
    const gcScore =
      gcPer100kMs == null || !Number.isFinite(tier.gcWorstRoundMs)
        ? null
        : normalizeLower(gcPer100kMs, [
              { value: 30, score: 100 },
              { value: 60, score: 92 },
              { value: 120, score: 78 },
              { value: 250, score: 55 },
              { value: 500, score: 25 },
              { value: 1000, score: 0 },
            ]) *
              0.55 +
            normalizeLower(tier.gcWorstRoundMs, [
              { value: 12, score: 100 },
              { value: 30, score: 92 },
              { value: 75, score: 78 },
              { value: 160, score: 55 },
              { value: 350, score: 25 },
              { value: 800, score: 0 },
            ]) *
              0.45;
    const components = [
      { score: foregroundScore, weight: 0.65, available: true },
      { score: copyScore, weight: 0.15, available: true },
      { score: sweepScore, weight: 0.1, available: sweepScore != null },
      { score: gcScore, weight: 0.1, available: gcScore != null },
    ].filter((component) => component.available);
    const componentWeight = components.reduce(
      (sum, component) => sum + component.weight,
      0,
    );
    const scoreExact =
      components.reduce(
        (sum, component) => sum + component.score * component.weight,
        0,
      ) / componentWeight;
    const score = Math.round(scoreExact);
    return {
      ...tier,
      copyOverheadMs,
      sweepScore,
      gcPer100kMs,
      gcScore,
      score,
      score1000: toScore1000(scoreExact),
      status: statusForScore(score),
    };
  });
  if (!summaries.length) {
    return {
      available: false,
      supported: supported !== false,
      score: 0,
      score1000: 0,
      tiers: [],
      highestComfortable: "None",
      highestUsable: "None",
      reserveLabel: "Not measured",
      reportedMemoryGB,
      reportedMemoryLabel: reportedMemoryLabel(reportedMemoryGB),
      gradeCeiling:
        capacityProbeCapped
          ? 100
          : reportedMemoryGB === 2
            ? 73
            : reportedMemoryGB === 4
              ? 81
              : 100,
      topGradeEligible: false,
      capacityProbeCapped,
    };
  }
  const weights = summaries.map((_, index) =>
    index === summaries.length - 1 ? 0.4 : 0.6 / Math.max(1, summaries.length - 1),
  );
  const scoreExact =
    summaries.reduce(
      (sum, tier, index) => sum + (tier.score1000 / 10) * weights[index],
      0,
    );
  const score = Math.round(scoreExact);
  const comfortableTiers = summaries.filter(
    (tier) => tier.status === "comfortable",
  );
  const usableTiers = summaries.filter((tier) =>
    ["comfortable", "usable"].includes(tier.status),
  );
  const highestComfortableMB = Math.max(
    ...comfortableTiers.map((tier) => tier.targetMB ?? 0),
    0,
  );
  const highestUsableMB = Math.max(
    ...usableTiers.map((tier) => tier.targetMB ?? 0),
    0,
  );
  const finalComfortableTier = comfortableTiers.find(
    (tier) => tier.targetMB === highestComfortableMB,
  );
  const topGradeEligible =
    highestComfortableMB >= 1536 &&
    (finalComfortableTier?.gcScore == null || finalComfortableTier.gcScore >= 75);
  let gradeCeiling =
    capacityProbeCapped
      ? 100
      : topGradeEligible
      ? 100
      : highestComfortableMB >= 1280
        ? 97
        : highestUsableMB >= 1024
          ? 93
          : highestUsableMB >= 768
            ? 89
            : highestUsableMB >= 512
              ? 85
              : highestUsableMB >= 384
                ? 77
                : 73;
  if (reportedMemoryGB === 2) gradeCeiling = Math.min(gradeCeiling, 73);
  if (reportedMemoryGB === 4) gradeCeiling = Math.min(gradeCeiling, 81);
  const reserveLabel =
    capacityProbeCapped
      ? "Stable in browser-safe range"
      : highestComfortableMB >= 1536
      ? "High browser reserve"
      : highestComfortableMB >= 1280 || highestUsableMB >= 1536
        ? "Strong browser reserve"
        : highestComfortableMB >= 1024 || highestUsableMB >= 1280
          ? "Good browser reserve"
          : highestComfortableMB >= 768 || highestUsableMB >= 1024
            ? "Everyday browser reserve"
            : highestComfortableMB >= 512 || highestUsableMB >= 768
              ? "Modest browser reserve"
              : "Constrained browser reserve";
  return {
    available: true,
    supported: true,
    score,
    score1000: toScore1000(scoreExact),
    tiers: summaries,
    highestComfortable:
      [...summaries].reverse().find((tier) => tier.status === "comfortable")
        ?.label ?? "None",
    highestUsable:
      [...summaries]
        .reverse()
        .find((tier) => ["comfortable", "usable"].includes(tier.status))
        ?.label ?? "None",
    highestComfortableMB,
    highestUsableMB,
    reserveLabel,
    reportedMemoryGB,
    reportedMemoryLabel: reportedMemoryLabel(reportedMemoryGB),
    gradeCeiling,
    topGradeEligible: capacityProbeCapped ? false : topGradeEligible,
    capacityProbeCapped,
  };
}

export function summarizeStorage(
  tiers = [],
  strictTiers = [],
  opfsTiers = [],
  availability = {},
) {
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
    const scoreExact = continuousLatencyScore(
      total,
      comfortable[index],
      usable[index],
      usable[index] * 1.5,
    );
    return {
      ...tier,
      totalMs: total,
      status,
      score: Math.round(scoreExact),
      score1000: toScore1000(scoreExact),
    };
  });
  const weights = [0.2, 0.3, 0.5];
  const bulkScoreExact = summaries.length
    ? summaries.reduce(
        (sum, tier, index) =>
          sum +
          (tier.score1000 / 10) *
            (weights[index] ?? 1 / summaries.length),
        0,
      )
    : 0;
  const bulkScore = Math.round(bulkScoreExact);
  const strictSummaries = strictTiers.map((tier) => {
    const scoreExact = tier.verified
      ? normalizeLower(tier.p95CommitMs, [
            { value: 5, score: 100 },
            { value: 15, score: 92 },
            { value: 40, score: 78 },
            { value: 100, score: 60 },
            { value: 300, score: 35 },
            { value: 800, score: 0 },
          ]) * 0.7 +
          normalizeLower(tier.worstCommitMs, [
              { value: 10, score: 100 },
              { value: 40, score: 90 },
              { value: 100, score: 75 },
              { value: 300, score: 50 },
              { value: 1000, score: 15 },
              { value: 2000, score: 0 },
          ]) * 0.3
      : 0;
    const score = Math.round(scoreExact);
    return {
      ...tier,
      score,
      score1000: toScore1000(scoreExact),
      status: statusForScore(score),
    };
  });
  const strictScoreExact = strictSummaries.length
    ? strictSummaries.reduce((sum, tier) => sum + tier.score1000 / 10, 0) /
      strictSummaries.length
    : 0;
  const strictScore = Math.round(strictScoreExact);
  const opfsSummaries = opfsTiers
    .filter((tier) => tier.available !== false)
    .map((tier) => {
      const writeRateMBs =
        tier.writeMs > 0 ? tier.sizeMB / (tier.writeMs / 1000) : 0;
      const randomReadMs =
        tier.randomReads > 0 ? tier.randomReadMs / tier.randomReads : 0;
      const flushP95Ms = tier.flushP95Ms ?? tier.flushMs;
      const flushWorstMs = tier.flushWorstMs ?? flushP95Ms;
      const components = tier.verified
        ? [
            {
              score: normalizeHigher(writeRateMBs, [
              { value: 150, score: 100 },
              { value: 80, score: 92 },
              { value: 40, score: 80 },
              { value: 20, score: 65 },
              { value: 8, score: 45 },
              { value: 2, score: 15 },
              ]),
              weight: 0.15,
            },
            {
              score: normalizeLower(flushP95Ms, [
                { value: 50, score: 100 },
                { value: 120, score: 90 },
                { value: 250, score: 75 },
                { value: 500, score: 55 },
                { value: 800, score: 35 },
                { value: 1500, score: 10 },
                { value: 3000, score: 0 },
              ]),
              weight: 0.4,
            },
            {
              score: normalizeLower(flushWorstMs, [
                { value: 75, score: 100 },
                { value: 180, score: 90 },
                { value: 400, score: 70 },
                { value: 800, score: 42 },
                { value: 1600, score: 12 },
                { value: 3200, score: 0 },
              ]),
              weight: 0.15,
            },
            {
              score: normalizeLower(randomReadMs, [
                { value: 0.1, score: 100 },
                { value: 0.5, score: 90 },
                { value: 2, score: 75 },
                { value: 8, score: 50 },
                { value: 30, score: 20 },
                { value: 100, score: 0 },
              ]),
              weight: 0.1,
            },
            ...(Number.isFinite(tier.foregroundP95Ms) &&
            tier.foregroundP95Ms > 0
              ? [
                  {
                    score: normalizeLower(tier.foregroundP95Ms, [
                      { value: 2, score: 100 },
                      { value: 12, score: 92 },
                      { value: 35, score: 78 },
                      { value: 100, score: 55 },
                      { value: 300, score: 25 },
                      { value: 800, score: 0 },
                    ]),
                    weight: 0.2,
                  },
                ]
              : []),
          ]
        : [];
      const componentWeight = components.reduce(
        (sum, component) => sum + component.weight,
        0,
      );
      const scoreExact = componentWeight
        ? components.reduce(
            (sum, component) => sum + component.score * component.weight,
            0,
          ) / componentWeight
        : 0;
      const score = Math.round(scoreExact);
      return {
        ...tier,
        writeRateMBs,
        randomReadLatencyMs: randomReadMs,
        flushP95Ms,
        flushWorstMs,
        score,
        score1000: toScore1000(scoreExact),
        status: statusForScore(score),
      };
    });
  const opfsTierWeights =
    opfsSummaries.length === 3
      ? [0.2, 0.3, 0.5]
      : opfsSummaries.map(() => 1 / Math.max(1, opfsSummaries.length));
  const opfsScoreExact = opfsSummaries.length
    ? opfsSummaries.reduce(
        (sum, tier, index) =>
          sum + (tier.score1000 / 10) * (opfsTierWeights[index] ?? 0),
        0,
      )
    : 0;
  const opfsScore = Math.round(opfsScoreExact);
  const sources = [
    {
      score: bulkScoreExact,
      weight: 0.15,
      available: availability.storageAvailable !== false && summaries.length > 0,
    },
    {
      score: strictScoreExact,
      weight: 0.3,
      available:
        availability.strictStorageAvailable !== false &&
        strictSummaries.length > 0,
    },
    {
      score: opfsScoreExact,
      weight: 0.55,
      available: opfsSummaries.length > 0,
    },
  ].filter((source) => source.available);
  const totalWeight = sources.reduce((sum, source) => sum + source.weight, 0);
  const scoreExact = totalWeight
    ? sources.reduce(
        (sum, source) => sum + source.score * source.weight,
        0,
      ) / totalWeight
    : 0;
  const score = Math.round(scoreExact);
  const largestPersistentTier = opfsSummaries.at(-1) ?? null;
  return {
    available: totalWeight > 0,
    score,
    score1000: toScore1000(scoreExact),
    tiers: [
      ...summaries.map((tier) => ({ ...tier, source: "browser-data" })),
      ...strictSummaries.map((tier) => ({ ...tier, source: "small-saves" })),
      ...opfsSummaries.map((tier) => ({ ...tier, source: "persistent-file" })),
    ],
    bulkScore,
    bulkScore1000: toScore1000(bulkScoreExact),
    strictScore,
    strictScore1000: toScore1000(strictScoreExact),
    opfsScore,
    opfsScore1000: toScore1000(opfsScoreExact),
    largeSaveScore: largestPersistentTier?.score ?? null,
    largeSaveStatus: largestPersistentTier?.status ?? "unavailable",
    largeSaveLabel: largestPersistentTier?.label ?? "Not measured",
    largeFlushMs: largestPersistentTier?.flushP95Ms ?? null,
    largeFlushWorstMs: largestPersistentTier?.flushWorstMs ?? null,
    coldLargeFlushMs: largestPersistentTier?.coldFlushMs ?? null,
    saveForegroundP95Ms: largestPersistentTier?.foregroundP95Ms ?? null,
    strictAvailable: strictSummaries.length > 0,
    opfsAvailable: opfsSummaries.length > 0,
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

function evidenceLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 68) return "Good";
  if (score >= 58) return "Usable";
  if (score >= 48) return "Limited";
  return "Struggling";
}

export function summarizeUpperReserve({
  browsing,
  email,
  writing,
  spreadsheets,
  multitasking,
  graphics,
  memory,
  storage,
  recoveryScore,
  mixedReserve,
}) {
  if (mixedReserve?.tested) {
    const levels =
      Array.isArray(mixedReserve.levels) && mixedReserve.levels.length
        ? mixedReserve.levels
        : [mixedReserve];
    const scoredLevels = levels.map((level) => {
      const loadedP95Ms = Number.isFinite(level.loadedP95Ms)
        ? level.loadedP95Ms
        : 3000;
      const loadedWorstMs = Number.isFinite(level.loadedWorstMs)
        ? level.loadedWorstMs
        : 6000;
      const slowdownRatio = Number.isFinite(level.slowdownRatio)
        ? Math.max(1, level.slowdownRatio)
        : 8;
      // The top of this curve deliberately preserves measurable separation:
      // a 16 ms loaded response and a 27 ms response are both excellent, but
      // they are no longer collapsed to the same perfect score.
      const responseScore = normalizeLower(loadedP95Ms, [
        { value: 12, score: 100 },
        { value: 16, score: 99 },
        { value: 27, score: 90 },
        { value: 40, score: 85 },
        { value: 55, score: 80 },
        { value: 90, score: 72 },
        { value: 150, score: 69 },
        { value: 250, score: 58 },
        { value: 450, score: 44 },
        { value: 800, score: 28 },
        { value: 1500, score: 12 },
        { value: 3000, score: 0 },
      ]);
      const slowdownScore = normalizeLower(slowdownRatio, [
        { value: 1.05, score: 100 },
        { value: 1.2, score: 97 },
        { value: 1.45, score: 92 },
        { value: 1.8, score: 86 },
        { value: 2.5, score: 76 },
        { value: 3.5, score: 64 },
        { value: 5, score: 48 },
        { value: 8, score: 22 },
        { value: 12, score: 0 },
      ]);
      const tailScore = normalizeLower(loadedWorstMs, [
        { value: 50, score: 100 },
        { value: 100, score: 96 },
        { value: 200, score: 89 },
        { value: 400, score: 80 },
        { value: 750, score: 68 },
        { value: 1400, score: 52 },
        { value: 2800, score: 30 },
        { value: 5000, score: 0 },
      ]);
      const frameScore = Number.isFinite(level.onTimeRatio)
        ? normalizeHigher(level.onTimeRatio, [
          { value: 0.98, score: 100 },
          { value: 0.94, score: 94 },
          { value: 0.86, score: 82 },
          { value: 0.72, score: 65 },
          { value: 0.5, score: 35 },
          { value: 0.25, score: 0 },
          ])
        : 80;
      let advancedScore = null;
      if (
        level.advancedAvailable === true &&
        Number.isFinite(level.advancedLoadedP95Ms) &&
        Number.isFinite(level.advancedSlowdownRatio)
      ) {
        const extended = level.id === "extended";
        const advancedResponseScore = normalizeLower(
          level.advancedLoadedP95Ms,
          extended
            ? [
                { value: 35, score: 100 },
                { value: 65, score: 97 },
                { value: 110, score: 93 },
                { value: 200, score: 88 },
                { value: 320, score: 82 },
                { value: 500, score: 75 },
                { value: 850, score: 65 },
                { value: 1400, score: 52 },
                { value: 2500, score: 38 },
                { value: 5000, score: 20 },
                { value: 12000, score: 0 },
              ]
            : [
                { value: 25, score: 100 },
                { value: 45, score: 97 },
                { value: 80, score: 93 },
                { value: 140, score: 88 },
                { value: 220, score: 82 },
                { value: 350, score: 75 },
                { value: 600, score: 65 },
                { value: 1000, score: 52 },
                { value: 1800, score: 38 },
                { value: 3500, score: 20 },
                { value: 9000, score: 0 },
              ],
        );
        const advancedSlowdownScore = normalizeLower(
          Math.max(1, level.advancedSlowdownRatio),
          [
            { value: 1.05, score: 100 },
            { value: 1.2, score: 96 },
            { value: 1.45, score: 89 },
            { value: 1.8, score: 80 },
            { value: 2.5, score: 66 },
            { value: 3.5, score: 48 },
            { value: 5, score: 25 },
            { value: 8, score: 0 },
          ],
        );
        const advancedStartupScore = Number.isFinite(level.advancedStartupMs)
          ? normalizeLower(level.advancedStartupMs, [
              { value: extended ? 220 : 150, score: 100 },
              { value: extended ? 380 : 250, score: 97 },
              { value: extended ? 650 : 450, score: 93 },
              { value: extended ? 1100 : 750, score: 87 },
              { value: extended ? 1800 : 1250, score: 78 },
              { value: extended ? 3200 : 2200, score: 65 },
              { value: extended ? 6000 : 4200, score: 48 },
              { value: extended ? 11000 : 8000, score: 25 },
              { value: extended ? 18000 : 14000, score: 0 },
            ])
          : 75;
        advancedScore = weightedGeometricMean([
          { score: advancedResponseScore, weight: 0.5 },
          { score: advancedSlowdownScore, weight: 0.35 },
          { score: advancedStartupScore, weight: 0.15 },
        ]);
      }
      const levelComponents = [
        { score: responseScore, weight: 0.45 },
        { score: slowdownScore, weight: 0.3 },
        { score: tailScore, weight: 0.15 },
        { score: frameScore, weight: 0.1 },
      ];
      if (Number.isFinite(advancedScore)) {
        levelComponents.push({ score: advancedScore, weight: 0.18 });
      }
      return {
        id: level.id ?? "standard",
        score: weightedGeometricMean(levelComponents),
        responseScore,
        slowdownScore,
        tailScore,
        frameScore,
        advancedScore,
      };
    });
    const scoreExact =
      scoredLevels.length > 1
        ? weightedGeometricMean([
            { score: scoredLevels[0].score, weight: 0.65 },
            { score: scoredLevels.at(-1).score, weight: 0.35 },
          ])
        : scoredLevels[0].score;
    const score = Math.round(scoreExact);
    const componentAverage = (key) =>
      Math.round(
        scoredLevels.reduce((sum, level, index) => {
          const weight = scoredLevels.length > 1 ? (index === 0 ? 0.65 : 0.35) : 1;
          return sum + level[key] * weight;
        }, 0),
      );
    const gradeCeiling = Math.max(87, Math.min(100, score + 7));
    const label =
      score >= 94
        ? "Exceptional reserve"
        : score >= 86
          ? "Very strong reserve"
          : score >= 76
            ? "Strong reserve"
            : score >= 64
              ? "Moderate reserve"
              : "Everyday work is stronger than sustained reserve";
    const components = [
      { id: "mixed-response", score: componentAverage("responseScore"), weight: 0.45 },
      { id: "slowdown", score: componentAverage("slowdownScore"), weight: 0.3 },
      { id: "tail", score: componentAverage("tailScore"), weight: 0.15 },
      { id: "frame-delivery", score: componentAverage("frameScore"), weight: 0.1 },
    ];
    const advancedLevels = scoredLevels.filter((level) => Number.isFinite(level.advancedScore));
    if (advancedLevels.length) {
      const advancedWeight = advancedLevels.length > 1 ? [0.65, 0.35] : [1];
      components.push({
        id: "advanced-web-work",
        score: Math.round(
          advancedLevels.reduce(
            (sum, level, index) => sum + level.advancedScore * advancedWeight[index],
            0,
          ),
        ),
        weight: 0.18,
      });
    }
    return {
      tested: true,
      score,
      score1000: toScore1000(scoreExact),
      label,
      gradeCeiling,
      components,
      levels: scoredLevels.map((level) => ({
        id: level.id,
        score: Math.round(level.score),
        score1000: toScore1000(level.score),
      })),
    };
  }
  const reserveScore = (category) => {
    const tier = category?.tiers?.find((candidate) => candidate.id === "reserve");
    return tier ? (Number.isFinite(tier.score) ? tier.score : 0) : undefined;
  };
  const components = [
    { id: "browsing", score: reserveScore(browsing), weight: 0.08 },
    { id: "email", score: reserveScore(email), weight: 0.08 },
    { id: "writing", score: reserveScore(writing), weight: 0.08 },
    {
      id: "spreadsheets",
      score: reserveScore(spreadsheets),
      weight: 0.08,
    },
    {
      id: "multitasking",
      score: reserveScore(multitasking),
      weight: 0.25,
    },
    {
      id: "graphics",
      score: reserveScore(graphics),
      weight: 0.13,
    },
    {
      id: "memory",
      score: memory?.tiers
        ?.filter((tier) => (tier.targetMB ?? 0) >= 1792)
        .at(-1)?.score,
      weight: 0.12,
    },
    {
      id: "storage",
      score: storage?.tiers
        ?.filter(
          (tier) =>
            tier.source === "persistent-file" && (tier.sizeMB ?? 0) >= 256,
        )
        .at(-1)?.score,
      weight: 0.1,
    },
    { id: "recovery", score: recoveryScore, weight: 0.08 },
  ].filter((component) => Number.isFinite(component.score));
  const coreReserveCount = components.filter((component) =>
    ["browsing", "email", "writing", "spreadsheets", "multitasking"].includes(
      component.id,
    ),
  ).length;
  if (coreReserveCount < 5) {
    return {
      tested: false,
      score: null,
      score1000: null,
      label: "Not needed",
      gradeCeiling: 100,
      components,
    };
  }
  const scoreExact = weightedGeometricMean(components);
  const score = Math.round(scoreExact);
  const gradeCeiling =
    score >= 94
      ? 100
      : score >= 88
        ? 97
        : score >= 80
          ? 96
          : score >= 70
            ? 95
            : score >= 60
              ? 94
              : 92;
  const label =
    score >= 94
      ? "Exceptional reserve"
      : score >= 86
        ? "Very strong reserve"
        : score >= 76
          ? "Strong reserve"
          : score >= 64
            ? "Moderate reserve"
            : "Everyday work is stronger than sustained reserve";
  return {
    tested: true,
    score,
    score1000: toScore1000(scoreExact),
    label,
    gradeCeiling,
    components,
  };
}

export function continuousHeadroomCeiling(headroomScore) {
  if (!Number.isFinite(headroomScore)) return 100;
  return Math.max(0, Math.min(100, Math.round(headroomScore + 12)));
}

function smoothOpportunityStrength(score, lower, upper) {
  if (!Number.isFinite(score) || score <= lower) return 0;
  if (score >= upper) return 1;
  const progress = (score - lower) / (upper - lower);
  return progress * progress * (3 - 2 * progress);
}

export function reserveOpportunityAward(upperReserve, baseScore1000) {
  const normalizedBaseScore1000 = Math.max(
    0,
    Math.min(1000, Number.isFinite(baseScore1000) ? baseScore1000 : 1000),
  );
  const remaining1000 = 1000 - normalizedBaseScore1000;
  if (!upperReserve?.tested) {
    return {
      tested: false,
      standardScore1000: null,
      extendedScore1000: null,
      standardBonus1000: 0,
      extendedBonus1000: 0,
      totalBonus1000: 0,
      standardStrength: 0,
      extendedStrength: 0,
      fillFraction: 0,
      remaining1000,
    };
  }
  const levels = Array.isArray(upperReserve.levels)
    ? upperReserve.levels
    : [];
  const standard = levels.find((level) => level.id === "standard");
  const extended = levels.find((level) => level.id === "extended");
  const standardScore1000 = Number.isFinite(standard?.score1000)
    ? standard.score1000
    : upperReserve.score1000;
  const extendedScore1000 = Number.isFinite(extended?.score1000)
    ? extended.score1000
    : null;
  const standardScore = Number.isFinite(standardScore1000)
    ? standardScore1000 / 10
    : null;
  const extendedScore = Number.isFinite(extendedScore1000)
    ? extendedScore1000 / 10
    : null;
  const standardStrength = smoothOpportunityStrength(standardScore, 75, 98);
  // Extended reserve remains deliberately difficult. Rather than replacing
  // the shared everyday result, each level can fill only part of the distance
  // that remains to the top of the scale.
  const extendedStrength = smoothOpportunityStrength(extendedScore, 98, 100);
  const standardFillFraction = 0.3 * standardStrength;
  const extendedFillFraction = 0.2 * extendedStrength;
  const standardBonus1000 = Math.round(
    remaining1000 * standardFillFraction,
  );
  const extendedBonus1000 = Math.round(
    remaining1000 * extendedFillFraction,
  );
  return {
    tested: true,
    standardScore1000,
    extendedScore1000,
    standardBonus1000,
    extendedBonus1000,
    totalBonus1000: standardBonus1000 + extendedBonus1000,
    standardStrength,
    extendedStrength,
    fillFraction: standardFillFraction + extendedFillFraction,
    remaining1000,
  };
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
  const memory = summarizeMemory(
    metrics.memoryTiers ?? [],
    metrics.memorySupported,
    metrics.reportedMemoryGB,
    { capacityProbeCapped: metrics.memoryCapacityProbeCapped },
  );
  const storage = summarizeStorage(
    metrics.storageTiers ?? [],
    metrics.strictStorageTiers ?? [],
    metrics.opfsStorageTiers ?? [],
    {
      storageAvailable: metrics.storageAvailable,
      strictStorageAvailable: metrics.strictStorageAvailable,
    },
  );
  const recoveryScore = normalizeLower(metrics.recoveryMs, recoveryPoints);
  const responsiveness = summarizeResponsivenessConsistency({
    tierGroups: [
      metrics.browsingTiers,
      metrics.emailTiers,
      metrics.writingTiers,
      metrics.spreadsheetTiers,
      metrics.multitaskTiers,
    ].map((tiers) =>
      tiers.filter((tier) => !nonEverydayTierIds.has(tier.id)),
    ),
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
  const browserSupport = browserSupportStatus(metrics.browserFamily);
  const upperReserve = summarizeUpperReserve({
    browsing,
    email,
    writing,
    spreadsheets,
    multitasking,
    graphics,
    memory,
    storage,
    recoveryScore,
    mixedReserve: metrics.mixedReserve,
  });

  const scoredCategories = [
    { score: preciseScore(browsing), weight: 0.25 },
    { score: preciseScore(email), weight: 0.1 },
    { score: preciseScore(writing), weight: 0.12 },
    { score: preciseScore(spreadsheets), weight: 0.12 },
    { score: preciseScore(multitasking), weight: 0.19 },
    { score: recoveryScore, weight: 0.04 },
  ];
  if (graphics.available)
    scoredCategories.push({ score: preciseScore(graphics), weight: 0.08 });
  if (video.available)
    scoredCategories.push({ score: preciseScore(video), weight: 0.04 });
  if (responsiveness.available)
    scoredCategories.push({ score: preciseScore(responsiveness), weight: 0.1 });
  let score = weightedGeometricMean(scoredCategories);
  const compositeBeforeSafeguards = score;

  const webExperienceCategories = [
    { score: preciseScore(browsing), weight: 0.25 },
    { score: preciseScore(email), weight: 0.1 },
    { score: preciseScore(writing), weight: 0.12 },
    { score: preciseScore(spreadsheets), weight: 0.12 },
    { score: preciseScore(multitasking), weight: 0.19 },
  ];
  if (graphics.available)
    webExperienceCategories.push({ score: preciseScore(graphics), weight: 0.08 });
  if (video.available)
    webExperienceCategories.push({ score: preciseScore(video), weight: 0.04 });
  if (responsiveness.available)
    webExperienceCategories.push({
      score: preciseScore(responsiveness),
      weight: 0.1,
    });
  const webExperienceScore = Math.round(
    weightedGeometricMean(webExperienceCategories),
  );

  const resourceResilienceCategories = [
    { score: recoveryScore, weight: 0.2 },
  ];
  if (memory.available)
    resourceResilienceCategories.push({ score: preciseScore(memory), weight: 0.45 });
  if (storage.available)
    resourceResilienceCategories.push({ score: preciseScore(storage), weight: 0.35 });
  let resourceResilienceScore = Math.round(
    weightedGeometricMean(resourceResilienceCategories),
  );
  if (storage.largeFlushMs > 500)
    resourceResilienceScore = Math.min(resourceResilienceScore, 75);
  if (storage.largeFlushMs > 1000)
    resourceResilienceScore = Math.min(resourceResilienceScore, 67);
  if (storage.largeFlushMs > 2000)
    resourceResilienceScore = Math.min(resourceResilienceScore, 57);
  if (memory.available && memory.score < 68)
    resourceResilienceScore = Math.min(resourceResilienceScore, 75);
  if (memory.available && memory.score < 48)
    resourceResilienceScore = Math.min(resourceResilienceScore, 67);
  const evidenceGroups = {
    profileVersion: browserEvidenceProfile.version,
    postScoreNormalizationApplied: false,
    webExperience: {
      score: webExperienceScore,
      label: evidenceLabel(webExperienceScore),
      preserveBrowserDifferences: true,
      categories: browserEvidenceProfile.webExperience.categories,
    },
    resourceResilience: {
      score: resourceResilienceScore,
      label: evidenceLabel(resourceResilienceScore),
      preserveBrowserDifferences: false,
      treatment: browserEvidenceProfile.resourceResilience.treatment,
      categories: browserEvidenceProfile.resourceResilience.categories,
    },
  };

  const coreMinimum = Math.min(
    (browsing.everydayScore1000 ?? browsing.score1000) / 10,
    (email.everydayScore1000 ?? email.score1000) / 10,
    (writing.everydayScore1000 ?? writing.score1000) / 10,
    (spreadsheets.everydayScore1000 ?? spreadsheets.score1000) / 10,
    (multitasking.everydayScore1000 ?? multitasking.score1000) / 10,
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
    !video.available ||
    metrics.memorySupported === false ||
    metrics.storageAvailable === false
      ? "Low"
      : variability > 0.25 ||
          invalidMeasurementCount > 0
        ? "Medium"
        : "High";

  const ceilingReached =
    coreMinimum >= 96 &&
    preciseScore(browsing) >= 96 &&
    preciseScore(graphics) >= 95 &&
    preciseScore(video) >= 95 &&
    (!memory.available || preciseScore(memory) >= 90) &&
    (!memory.available || memory.topGradeEligible) &&
    (!storage.available || preciseScore(storage) >= 90) &&
    (!responsiveness.available || preciseScore(responsiveness) >= 90) &&
    invalidMeasurementCount === 0 &&
    variability <= 0.12 &&
    (!upperReserve.tested || preciseScore(upperReserve) >= 94);
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
  if (memory.available && memory.score < 68) score = Math.min(score, 83);
  if (memory.available && memory.score < 48) score = Math.min(score, 75);
  if (storage.available && storage.score < 58) score = Math.min(score, 83);
  if (storage.available && storage.score < 38) score = Math.min(score, 75);
  const headroomCeilingExact = Math.max(
    0,
    Math.min(100, (headroom.score1000 ?? headroom.score * 10) / 10 + 12),
  );
  score = Math.min(score, headroomCeilingExact);

  let practicalPenalty = 0;
  if (memory.available && preciseScore(memory) < 75)
    practicalPenalty += Math.min(8, (75 - preciseScore(memory)) * 0.16);
  const storagePenalty =
    storage.available && preciseScore(storage) < 90
      ? Math.min(6, (90 - preciseScore(storage)) * 0.16)
      : 0;
  const largeSavePenalty =
    storage.largeSaveScore != null && storage.largeSaveScore < 82
      ? Math.min(7, (82 - storage.largeSaveScore) * 0.18)
      : 0;
  // Storage and large-save scores share OPFS evidence. Use the stronger single
  // penalty instead of charging the same slow flush twice.
  practicalPenalty += Math.max(storagePenalty, largeSavePenalty);
  if ((storage.coldLargeFlushMs ?? 0) > 1000)
    practicalPenalty += (storage.largeFlushMs ?? 0) < 500 ? 2 : 1;
  practicalPenalty = Math.min(10, practicalPenalty);
  score -= practicalPenalty;

  if (storage.largeFlushMs > 500) score = Math.min(score, 83);
  if (storage.largeFlushMs > 1000) score = Math.min(score, 75);
  if (storage.largeFlushMs > 2000) score = Math.min(score, 67);

  if (memory.available && Number.isFinite(memory.gradeCeiling))
    score = Math.min(score, memory.gradeCeiling);

  const scoreBeforeReserve = score;
  const baseScore1000 = toScore1000(scoreBeforeReserve);
  const reserveAward = reserveOpportunityAward(upperReserve, baseScore1000);
  score = Math.min(100, (baseScore1000 + reserveAward.totalBonus1000) / 10);

  const uncalibratedScore1000 = toScore1000(score);
  const calibratedScore1000 = calibrateTopEndScore1000(uncalibratedScore1000);
  const boundedReserveVerified =
    memory.capacityProbeCapped !== true ||
    (upperReserve.tested && preciseScore(upperReserve) >= 88);
  const broadCapabilityEvidenceCeiling1000 = boundedReserveVerified ? 1000 : 880;
  const score1000 = Math.min(
    calibratedScore1000,
    broadCapabilityEvidenceCeiling1000,
  );
  score = Math.round(score1000 / 10);
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
  if (metrics.memorySupported === false)
    integrityNotes.push(
      "Responsiveness under controlled memory pressure could not be verified in this browser.",
    );
  else if (metrics.memoryCapacityProbeCapped)
    integrityNotes.push(
      "The retained-memory check was intentionally bounded on this mobile browser to avoid an operating-system page reload; responsiveness within the browser-safe range was measured.",
    );
  if (metrics.storageAvailable === false)
    integrityNotes.push(
      "Persistent browser storage could not be verified in this browser.",
    );
  else if (
    Array.isArray(metrics.opfsStorageTiers) &&
    !storage.opfsAvailable
  )
    integrityNotes.push(
      "Persistent-file flush timing was unavailable; browser database saves were still measured.",
    );
  if ((storage.coldLargeFlushMs ?? 0) > 750)
    integrityNotes.push(
      "The first large persistent save was much slower than the repeated steady measurements; it is reported as a cold-start stall rather than counted twice.",
    );
  if (metrics.interruptionCount > 0)
    integrityNotes.push("The test tab was hidden or interrupted during the run.");
  if (metrics.baselineUnsettled)
    integrityNotes.push(
      "Background activity was already delaying the browser before the test. Retest after the computer settles for a cleaner comparison.",
    );
  if (browserSupport.level === "experimental")
    integrityNotes.push(
      "Firefox support is experimental. Web Experience reflects the measured Firefox behavior; no browser-specific score multiplier was applied.",
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

  const latencyMatrixRow = (category) => ({
    everyday: category.everydayScore1000 ?? category.score1000,
    capacity: category.capacityScore1000 ?? category.score1000,
    combined: category.score1000,
  });
  const internalScoring = {
    scale: 1000,
    aggregation: "normalized-weighted-geometric-with-calibrated-top-range-v4",
    compositeBeforeSafeguards: toScore1000(compositeBeforeSafeguards),
    baseBeforeReserve: toScore1000(scoreBeforeReserve),
    // Retained for readers of older exports. No cap is applied in this profile.
    baseAfterReserveCap: baseScore1000,
    baseForReserve: baseScore1000,
    reserveAward,
    uncalibratedFinal: uncalibratedScore1000,
    topEndCalibration: {
      applied: uncalibratedScore1000 > 900,
      input: uncalibratedScore1000,
      output: calibratedScore1000,
    },
    broadCapabilityEvidence: {
      memoryCapacityProbeCapped: memory.capacityProbeCapped === true,
      reserveVerified: boundedReserveVerified,
      ceiling1000: broadCapabilityEvidenceCeiling1000,
      applied: score1000 < calibratedScore1000,
    },
    final: score1000,
    publicScore: score,
    matrix: {
      browsing: latencyMatrixRow(browsing),
      email: latencyMatrixRow(email),
      writing: latencyMatrixRow(writing),
      spreadsheets: latencyMatrixRow(spreadsheets),
      multitasking: latencyMatrixRow(multitasking),
      graphics: { combined: graphics.available ? graphics.score1000 : null },
      video: { combined: video.available ? video.score1000 : null },
      responsiveness: {
        combined: responsiveness.available ? responsiveness.score1000 : null,
      },
      memory: { combined: memory.available ? memory.score1000 : null },
      storage: {
        browserData: storage.available ? storage.bulkScore1000 : null,
        smallSaves: storage.strictAvailable ? storage.strictScore1000 : null,
        persistentFile: storage.opfsAvailable ? storage.opfsScore1000 : null,
        combined: storage.available ? storage.score1000 : null,
      },
      recovery: { combined: toScore1000(recoveryScore) },
      headroom: { combined: headroom.score1000 },
      upperReserve: {
        combined: upperReserve.tested ? upperReserve.score1000 : null,
      },
    },
    safeguards: {
      headroomCeiling: toScore1000(headroomCeilingExact),
      memoryGradeCeiling: Number.isFinite(memory.gradeCeiling)
        ? memory.gradeCeiling * 10
        : 1000,
      reserveBaseCap: 1000,
      practicalPenalty: Math.round(practicalPenalty * 10),
    },
  };

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
    memory,
    storage,
    responsiveness,
    headroom,
    upperReserve,
    internalScoring,
    evidenceGroups,
    browserSupport,
    recoveryMs: metrics.recoveryMs,
    recoveryScore: Math.round(recoveryScore),
    practicalPenalty: Math.round(practicalPenalty * 10) / 10,
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
