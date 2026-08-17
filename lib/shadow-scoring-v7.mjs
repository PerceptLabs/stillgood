const SHADOW_VERSION = "7.0.0-shadow.1";

const tierWeights = {
  basic: 0.12,
  everyday: 0.16,
  busy: 0.2,
  demanding: 0.24,
  extreme: 0.28,
};

const categoryProfiles = {
  browsing: {
    metricsKey: "browsingTiers",
    weight: 0.28,
    comfortableMedianMs: 260,
    comfortableWorstMs: 650,
    referenceCapacity: 45000,
    sizes: {
      basic: 400,
      everyday: 1800,
      busy: 6500,
      demanding: 18000,
      extreme: 45000,
      headroom: 120000,
      limit: 250000,
    },
  },
  email: {
    metricsKey: "emailTiers",
    weight: 0.13,
    comfortableMedianMs: 260,
    comfortableWorstMs: 650,
    referenceCapacity: 100000,
    sizes: {
      basic: 1000,
      everyday: 5000,
      busy: 20000,
      demanding: 50000,
      extreme: 100000,
      headroom: 250000,
      limit: 500000,
    },
  },
  writing: {
    metricsKey: "writingTiers",
    weight: 0.18,
    comfortableMedianMs: 320,
    comfortableWorstMs: 800,
    referenceCapacity: 100000,
    sizes: {
      basic: 1500,
      everyday: 8000,
      busy: 25000,
      demanding: 60000,
      extreme: 100000,
      headroom: 250000,
      limit: 500000,
    },
  },
  spreadsheets: {
    metricsKey: "spreadsheetTiers",
    weight: 0.18,
    comfortableMedianMs: 300,
    comfortableWorstMs: 750,
    referenceCapacity: 400000,
    sizes: {
      basic: 1000,
      everyday: 10000,
      busy: 50000,
      demanding: 150000,
      extreme: 400000,
      headroom: 1000000,
      limit: 2000000,
    },
  },
  multitasking: {
    metricsKey: "multitaskTiers",
    weight: 0.23,
    comfortableMedianMs: 260,
    comfortableWorstMs: 650,
    referenceCapacity: 85000,
    sizes: {
      basic: 1200,
      everyday: 4500,
      busy: 14000,
      demanding: 38000,
      extreme: 85000,
    },
  },
};

function finite(value) {
  return Number.isFinite(value) ? value : null;
}

function clampPositive(value, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function weightedGeometricMean(entries) {
  const valid = entries.filter(
    (entry) =>
      Number.isFinite(entry?.value) && entry.value > 0 && entry.weight > 0,
  );
  const totalWeight = valid.reduce((sum, entry) => sum + entry.weight, 0);
  if (!totalWeight) return null;
  return Math.exp(
    valid.reduce(
      (sum, entry) => sum + entry.weight * Math.log(entry.value),
      0,
    ) / totalWeight,
  );
}

function tierDurations(tier) {
  return Array.isArray(tier?.samples)
    ? tier.samples
        .map((sample) =>
          typeof sample === "number" ? sample : sample?.durationMs,
        )
        .filter((value) => Number.isFinite(value) && value > 0)
    : [];
}

function tierObservation(tier, profile) {
  const durations = tierDurations(tier);
  if (!durations.length) return null;
  const medianMs = median(durations);
  const worstMs = Math.max(...durations);
  const medianRatio = profile.comfortableMedianMs / clampPositive(medianMs);
  const worstRatio = profile.comfortableWorstMs / clampPositive(worstMs);
  const fixedWorkRatio = weightedGeometricMean([
    { value: medianRatio, weight: 0.7 },
    { value: worstRatio, weight: 0.3 },
  ]);
  const effectiveLoad = Math.max(
    clampPositive(medianMs) / profile.comfortableMedianMs,
    clampPositive(worstMs) / profile.comfortableWorstMs,
  );
  return {
    id: tier.id,
    size: profile.sizes[tier.id],
    medianMs,
    worstMs,
    fixedWorkRatio,
    effectiveLoad,
    earlyStopped: Boolean(tier.earlyStopped),
  };
}

function estimateComfortableCapacity(observations) {
  const ordered = observations
    .filter(
      (observation) =>
        Number.isFinite(observation.size) &&
        observation.size > 0 &&
        Number.isFinite(observation.effectiveLoad),
    )
    .sort((a, b) => a.size - b.size);
  if (!ordered.length) {
    return { capacity: null, openCeiling: false, bracket: null };
  }

  let monotonicLoad = 0;
  const monotonic = ordered.map((observation) => {
    monotonicLoad = Math.max(monotonicLoad, observation.effectiveLoad);
    return { ...observation, monotonicLoad };
  });
  const first = monotonic[0];
  if (first.monotonicLoad > 1) {
    return {
      capacity: first.size / first.monotonicLoad,
      openCeiling: false,
      bracket: [null, first.id],
    };
  }

  for (let index = 1; index < monotonic.length; index += 1) {
    const lower = monotonic[index - 1];
    const upper = monotonic[index];
    if (lower.monotonicLoad <= 1 && upper.monotonicLoad > 1) {
      const lowerLoad = Math.max(0.0001, lower.monotonicLoad);
      const upperLoad = Math.max(lowerLoad + 0.0001, upper.monotonicLoad);
      const progress =
        (Math.log(1) - Math.log(lowerLoad)) /
        (Math.log(upperLoad) - Math.log(lowerLoad));
      const capacity = Math.exp(
        Math.log(lower.size) +
          Math.max(0, Math.min(1, progress)) *
            (Math.log(upper.size) - Math.log(lower.size)),
      );
      return {
        capacity,
        openCeiling: false,
        bracket: [lower.id, upper.id],
      };
    }
  }

  const last = monotonic.at(-1);
  return {
    capacity: last.size,
    openCeiling: true,
    bracket: [last.id, null],
  };
}

function summarizeCategory(tiers, profile) {
  const observations = (Array.isArray(tiers) ? tiers : [])
    .map((tier) => tierObservation(tier, profile))
    .filter(Boolean);
  const ordinary = observations.filter((observation) =>
    Object.hasOwn(tierWeights, observation.id),
  );
  const fixedWorkRatio = weightedGeometricMean(
    ordinary.map((observation) => ({
      value: observation.fixedWorkRatio,
      weight: tierWeights[observation.id],
    })),
  );
  const capacity = estimateComfortableCapacity(observations);
  const capacityRatio = Number.isFinite(capacity.capacity)
    ? capacity.capacity / profile.referenceCapacity
    : null;
  const combinedRatio = weightedGeometricMean([
    { value: fixedWorkRatio, weight: 0.65 },
    { value: capacityRatio, weight: 0.35 },
  ]);
  return {
    index: Number.isFinite(combinedRatio)
      ? Math.round(combinedRatio * 1000)
      : null,
    fixedWorkIndex: Number.isFinite(fixedWorkRatio)
      ? Math.round(fixedWorkRatio * 1000)
      : null,
    capacityIndex: Number.isFinite(capacityRatio)
      ? Math.round(capacityRatio * 1000)
      : null,
    comfortableCapacity: Number.isFinite(capacity.capacity)
      ? Math.round(capacity.capacity)
      : null,
    referenceCapacity: profile.referenceCapacity,
    openCeiling: capacity.openCeiling,
    bracket: capacity.bracket,
    ordinaryTierCount: ordinary.length,
    observations: observations.map((observation) => ({
      id: observation.id,
      size: observation.size,
      medianMs: Math.round(observation.medianMs * 10) / 10,
      worstMs: Math.round(observation.worstMs * 10) / 10,
      fixedWorkIndex: Math.round(observation.fixedWorkRatio * 1000),
      effectiveLoad: Math.round(observation.effectiveLoad * 1000) / 1000,
    })),
  };
}

function summarizePressureLevel(level, id) {
  if (!level) return null;
  const extended = id === "extended";
  const components = [
    {
      id: "foreground-latency",
      value: 100 / clampPositive(level.loadedP95Ms, 5000),
      weight: 0.32,
    },
    {
      id: "tail-latency",
      value: 250 / clampPositive(level.loadedWorstMs, 10000),
      weight: 0.13,
    },
    {
      id: "slowdown-resilience",
      value: 2.8 / Math.max(1, clampPositive(level.slowdownRatio, 12)),
      weight: 0.1,
    },
    {
      id: "frame-delivery",
      value: clampPositive(level.onTimeRatio, 0.1) / 0.9,
      weight: 0.05,
    },
  ];
  if (Number.isFinite(level.advancedIterations)) {
    components.push({
      id: "advanced-throughput",
      value: level.advancedIterations / (extended ? 45 : 30),
      weight: 0.27,
    });
  }
  if (Number.isFinite(level.advancedLoadedP95Ms)) {
    components.push({
      id: "advanced-latency",
      value:
        (extended ? 600 : 450) /
        clampPositive(level.advancedLoadedP95Ms, 12000),
      weight: 0.13,
    });
  }
  const ratio = weightedGeometricMean(components);
  return {
    id,
    index: Number.isFinite(ratio) ? Math.round(ratio * 1000) : null,
    workerCount: finite(level.workerCount),
    memoryPressureMB: finite(level.memoryPressureMB),
    storagePressureMB: finite(level.storagePressureMB),
    components: components.map((component) => ({
      id: component.id,
      index: Math.round(component.value * 1000),
      weight: component.weight,
    })),
  };
}

function summarizePressure(mixedReserve) {
  if (!mixedReserve?.tested) {
    return {
      available: false,
      standardIndex: null,
      extendedIndex: null,
      combinedIndex: null,
      levels: [],
    };
  }
  const sourceLevels =
    Array.isArray(mixedReserve.levels) && mixedReserve.levels.length
      ? mixedReserve.levels
      : [mixedReserve];
  const levels = sourceLevels
    .map((level, index) =>
      summarizePressureLevel(
        level,
        level.id ?? (index === 0 ? "standard" : "extended"),
      ),
    )
    .filter(Boolean);
  const standard = levels.find((level) => level.id === "standard") ?? levels[0];
  const extended = levels.find((level) => level.id === "extended");
  const combinedRatio = weightedGeometricMean([
    { value: standard?.index / 1000, weight: 0.7 },
    { value: extended?.index / 1000, weight: 0.3 },
  ]);
  return {
    available: Boolean(standard),
    standardIndex: standard?.index ?? null,
    extendedIndex: extended?.index ?? null,
    combinedIndex: Number.isFinite(combinedRatio)
      ? Math.round(combinedRatio * 1000)
      : null,
    levels,
  };
}

export const shadowReferenceProfile = {
  version: SHADOW_VERSION,
  referenceIndex: 1000,
  calibration: "provisional-comfort-capacity-ratios-v1",
  categoryProfiles,
};

export function summarizeShadowV7(metrics = {}) {
  const categories = Object.fromEntries(
    Object.entries(categoryProfiles).map(([id, profile]) => [
      id,
      summarizeCategory(metrics[profile.metricsKey], profile),
    ]),
  );
  const webRatio = weightedGeometricMean(
    Object.entries(categoryProfiles).map(([id, profile]) => ({
      value: categories[id].index / 1000,
      weight: profile.weight,
    })),
  );
  const pressure = summarizePressure(metrics.mixedReserve);
  const webIndex = Number.isFinite(webRatio) ? Math.round(webRatio * 1000) : null;
  const systemRatio = weightedGeometricMean([
    { value: webIndex / 1000, weight: 0.75 },
    { value: pressure.standardIndex / 1000, weight: 0.25 },
  ]);

  return {
    version: SHADOW_VERSION,
    status: "shadow",
    calibration: "provisional-comfort-capacity-ratios-v1",
    referenceIndex: 1000,
    publicScoreAffected: false,
    webIndex,
    pressureIndex: pressure.standardIndex,
    extendedPressureIndex: pressure.extendedIndex,
    systemIndex: Number.isFinite(systemRatio)
      ? Math.round(systemRatio * 1000)
      : webIndex,
    coverage: pressure.available ? "web-and-standard-pressure" : "web-only",
    categories,
    pressure,
  };
}
