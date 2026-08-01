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

function medianValue(values) {
  const sorted = values
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
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

export function needsVideoConfirmation(tiers, index) {
  const tier = tiers[index];
  if (!tier || tier.skipped || isComfortableVideoTier(tier)) return false;
  return tiers
    .slice(index + 1)
    .some((higherTier) => isComfortableVideoTier(higherTier));
}

export function consolidateVideoTierAttempts(attempts) {
  if (!attempts.length) throw new Error("At least one video attempt is required");
  const required = Math.floor(attempts.length / 2) + 1;
  const validAttempts = attempts.filter((attempt) => attempt.valid !== false);
  const completedAttempts = attempts.filter((attempt) => attempt.completed);
  const first = attempts[0];
  return {
    ...first,
    droppedRatio: medianValue(attempts.map((attempt) => attempt.droppedRatio)),
    stalls: medianValue(attempts.map((attempt) => attempt.stalls)),
    stallDurationMs: medianValue(
      attempts.map((attempt) => attempt.stallDurationMs),
    ),
    longestStallMs: medianValue(
      attempts.map((attempt) => attempt.longestStallMs),
    ),
    completed: completedAttempts.length >= required,
    totalFrames: medianValue(attempts.map((attempt) => attempt.totalFrames)),
    valid: validAttempts.length >= required,
    measurementSource:
      attempts.find(
        (attempt) => attempt.measurementSource === "playback-quality",
      )?.measurementSource ??
      attempts.find((attempt) => attempt.measurementSource === "frame-callback")
        ?.measurementSource ??
      "unavailable",
    mediaAdvancedMs: medianValue(
      attempts.map((attempt) => attempt.mediaAdvancedMs),
    ),
    confirmationRuns: attempts.length - 1,
    initialDroppedRatio: first.droppedRatio,
    attemptDroppedRatios: attempts.map((attempt) => attempt.droppedRatio),
    attemptStallDurationsMs: attempts.map(
      (attempt) => attempt.stallDurationMs,
    ),
  };
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
