const coreCategories = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "multitasking",
];

export function planUpperReserve(summary) {
  const base = {
    needed: false,
    reason: "ordinary-range-is-enough",
    minimumScore: 89,
    minimumScore1000: 885,
    minimumHeadroom: null,
    minimumCoreScore: 86,
    minimumCoreScore1000: 860,
  };
  if (!summary) return { ...base, reason: "no-summary" };
  if (summary.confidence !== "High") {
    return { ...base, reason: "confidence-not-high" };
  }
  const candidateScore1000 = Number.isFinite(summary.internalScoring?.final)
    ? summary.internalScoring.final
    : Number.isFinite(summary.score)
      ? summary.score * 10
      : null;
  if (
    !Number.isFinite(candidateScore1000) ||
    candidateScore1000 < base.minimumScore1000
  ) {
    return base;
  }
  const coreScores1000 = coreCategories
    .map((category) =>
      Number.isFinite(summary[category]?.score1000)
        ? summary[category].score1000
        : Number.isFinite(summary[category]?.score)
          ? summary[category].score * 10
          : null,
    )
    .filter(Number.isFinite);
  if (
    coreScores1000.length !== coreCategories.length ||
    Math.min(...coreScores1000) < base.minimumCoreScore1000
  ) {
    return { ...base, reason: "core-work-below-gate" };
  }
  if (
    summary.memory?.available &&
    summary.memory.capacityProbeCapped !== true &&
    summary.memory.topGradeEligible === false
  ) {
    return { ...base, reason: "memory-reserve-below-gate" };
  }
  if (summary.storage?.available && summary.storage.score < 88) {
    return { ...base, reason: "storage-reserve-below-gate" };
  }
  return {
    ...base,
    needed: true,
    reason: "upper-range-qualified",
    candidateScore1000,
    observedHeadroom: Number.isFinite(summary.headroom?.score)
      ? summary.headroom.score
      : null,
    categories: [...coreCategories],
  };
}

export function shouldRunExtendedReserve(level) {
  if (!level) return false;
  const advancedReady =
    level.advancedAvailable !== true ||
    (Number.isFinite(level.advancedLoadedP95Ms) &&
      level.advancedLoadedP95Ms <= 900 &&
      Number.isFinite(level.advancedSlowdownRatio) &&
      level.advancedSlowdownRatio <= 1.8);
  return (
    Number.isFinite(level.loadedP95Ms) &&
    level.loadedP95Ms <= 55 &&
    Number.isFinite(level.loadedWorstMs) &&
    level.loadedWorstMs <= 125 &&
    Number.isFinite(level.slowdownRatio) &&
    level.slowdownRatio <= 1.45 &&
    Number.isFinite(level.onTimeRatio) &&
    level.onTimeRatio >= 0.95 &&
    advancedReady
  );
}
