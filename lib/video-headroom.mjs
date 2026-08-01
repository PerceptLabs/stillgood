function stallDuration(tier) {
  return Number.isFinite(tier?.stallDurationMs)
    ? Math.max(0, tier.stallDurationMs)
    : tier?.stalls > 0
      ? tier.stalls * 350
      : 0;
}

function longestStall(tier) {
  return Number.isFinite(tier?.longestStallMs)
    ? Math.max(0, tier.longestStallMs)
    : tier?.stalls > 0
      ? 350
      : 0;
}

export function isComfortableVideoTier(tier) {
  return Boolean(
    tier &&
      tier.valid !== false &&
      tier.completed &&
      tier.droppedRatio <= 0.01 &&
      stallDuration(tier) <= 100 &&
      longestStall(tier) <= 100,
  );
}

export function shouldAttemptExtendedVideo({
  latencyGroups,
  graphicsTiers,
  baseVideoTier,
}) {
  const reserveGroups = latencyGroups.filter((tiers) =>
    tiers.some((tier) => tier.id === "headroom" && !tier.earlyStopped),
  ).length;
  const ordinaryGraphics = graphicsTiers.slice(0, 3);
  const graphicsAreHealthy =
    ordinaryGraphics.length === 3 &&
    ordinaryGraphics.every(
      (tier) => tier.valid !== false && tier.onTimeRatio >= 0.85,
    );
  return (
    reserveGroups >= 3 &&
    graphicsAreHealthy &&
    isComfortableVideoTier(baseVideoTier)
  );
}

export function shouldAttempt4k(tiers) {
  const fullHd60 = tiers.find((tier) => tier.id === "1080p60");
  const quadHd = tiers.find((tier) => tier.id === "1440p");
  return (
    isComfortableVideoTier(fullHd60) && isComfortableVideoTier(quadHd)
  );
}
