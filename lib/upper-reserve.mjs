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
    minimumHeadroom: 83,
    minimumCoreScore: 86,
  };
  if (!summary) return { ...base, reason: "no-summary" };
  if (summary.confidence !== "High") {
    return { ...base, reason: "confidence-not-high" };
  }
  if (!Number.isFinite(summary.score) || summary.score < base.minimumScore) {
    return base;
  }
  if (
    !Number.isFinite(summary.headroom?.score) ||
    summary.headroom.score < base.minimumHeadroom
  ) {
    return { ...base, reason: "headroom-below-gate" };
  }
  const coreScores = coreCategories
    .map((category) => summary[category]?.score)
    .filter(Number.isFinite);
  if (
    coreScores.length !== coreCategories.length ||
    Math.min(...coreScores) < base.minimumCoreScore
  ) {
    return { ...base, reason: "core-work-below-gate" };
  }
  if (
    summary.memory?.available &&
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
    categories: [...coreCategories],
  };
}
