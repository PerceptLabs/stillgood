const categoryNames = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "graphics",
  "video",
  "multitasking",
  "memory",
  "storage",
];

const confirmationCategories = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "multitasking",
];
const confirmationReasons = [
  "grade-boundary",
  "capability-boundary",
  "low-confidence",
  "not-near-boundary",
  "no-summary",
];
const reserveComponents = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "multitasking",
  "graphics",
  "memory",
  "storage",
  "recovery",
  "mixed-response",
  "slowdown",
  "tail",
  "frame-delivery",
  "advanced-web-work",
];
const shadowCategoryNames = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "multitasking",
];
const shadowPressureComponents = [
  "foreground-latency",
  "tail-latency",
  "slowdown-resilience",
  "frame-delivery",
  "advanced-throughput",
  "advanced-latency",
];

function objectValue(value) {
  return value && typeof value === "object" ? value : {};
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compactCategory(value) {
  const category = objectValue(value);
  return {
    score: finiteNumber(category.score),
    available: typeof category.available === "boolean" ? category.available : null,
    highestComfortable:
      typeof category.highestComfortable === "string"
        ? category.highestComfortable
        : null,
    highestUsable:
      typeof category.highestUsable === "string" ? category.highestUsable : null,
    testedHeadroom:
      typeof category.testedHeadroom === "boolean" ? category.testedHeadroom : null,
    limitFound:
      typeof category.limitFound === "boolean" ? category.limitFound : null,
    tiers: Array.isArray(category.tiers)
      ? category.tiers.map((tierValue) => {
          const tier = objectValue(tierValue);
          return {
            id: typeof tier.id === "string" ? tier.id : "unknown",
            medianMs: finiteNumber(tier.medianMs),
            worstMs: finiteNumber(tier.worstMs),
            cv: finiteNumber(tier.cv),
            score: finiteNumber(tier.score),
            status: typeof tier.status === "string" ? tier.status : null,
            earlyStopped:
              typeof tier.earlyStopped === "boolean" ? tier.earlyStopped : null,
          };
        })
      : [],
  };
}

function compactBoundaryConfirmation(value) {
  const confirmation = objectValue(value);
  const cleanCategory = (category) =>
    typeof category === "string" && confirmationCategories.includes(category)
      ? category
      : null;
  const cleanGrade = (grade) =>
    typeof grade === "string" && /^[A-E][+-]?$/.test(grade) ? grade : null;

  return {
    triggered: Boolean(confirmation.triggered),
    reason:
      typeof confirmation.reason === "string" &&
      confirmationReasons.includes(confirmation.reason)
        ? confirmation.reason
        : "not-near-boundary",
    margin: finiteNumber(confirmation.margin),
    gradeBoundary: finiteNumber(confirmation.gradeBoundary),
    plannedCategories: Array.isArray(confirmation.plannedCategories)
      ? confirmation.plannedCategories
          .map(cleanCategory)
          .filter(Boolean)
          .slice(0, 3)
      : [],
    runs: Array.isArray(confirmation.runs)
      ? confirmation.runs.slice(0, 3).flatMap((runValue) => {
          const run = objectValue(runValue);
          const category = cleanCategory(run.category);
          if (!category) return [];
          return [
            {
              category,
              tier:
                typeof run.tier === "string" && /^[a-z0-9_-]{1,40}$/i.test(run.tier)
                  ? run.tier
                  : "unknown",
              addedSamples: finiteNumber(run.addedSamples),
            },
          ];
        })
      : [],
    scoreBefore: finiteNumber(confirmation.scoreBefore),
    gradeBefore: cleanGrade(confirmation.gradeBefore),
    scoreAfter: finiteNumber(confirmation.scoreAfter),
    gradeAfter: cleanGrade(confirmation.gradeAfter),
  };
}

function compactShadowScoring(value) {
  const shadow = objectValue(value);
  const pressure = objectValue(shadow.pressure);
  const categories = objectValue(shadow.categories);
  const cleanTierId = (tier) =>
    typeof tier === "string" && /^[a-z0-9_-]{1,40}$/i.test(tier)
      ? tier
      : null;

  return {
    version:
      typeof shadow.version === "string" && /^[a-z0-9._-]{1,80}$/i.test(shadow.version)
        ? shadow.version
        : "unknown",
    status: shadow.status === "shadow" ? "shadow" : "unknown",
    calibration:
      typeof shadow.calibration === "string" &&
      /^[a-z0-9._-]{1,80}$/i.test(shadow.calibration)
        ? shadow.calibration
        : "unknown",
    referenceIndex: finiteNumber(shadow.referenceIndex),
    publicScoreAffected: Boolean(shadow.publicScoreAffected),
    webIndex: finiteNumber(shadow.webIndex),
    pressureIndex: finiteNumber(shadow.pressureIndex),
    extendedPressureIndex: finiteNumber(shadow.extendedPressureIndex),
    systemIndex: finiteNumber(shadow.systemIndex),
    coverage: ["web-only", "web-and-standard-pressure"].includes(shadow.coverage)
      ? shadow.coverage
      : "unknown",
    categories: Object.fromEntries(
      shadowCategoryNames.map((name) => {
        const category = objectValue(categories[name]);
        const bracket = Array.isArray(category.bracket)
          ? category.bracket.slice(0, 2).map(cleanTierId)
          : [];
        return [
          name,
          {
            index: finiteNumber(category.index),
            fixedWorkIndex: finiteNumber(category.fixedWorkIndex),
            capacityIndex: finiteNumber(category.capacityIndex),
            comfortableCapacity: finiteNumber(category.comfortableCapacity),
            referenceCapacity: finiteNumber(category.referenceCapacity),
            openCeiling: Boolean(category.openCeiling),
            ordinaryTierCount: finiteNumber(category.ordinaryTierCount),
            bracket,
          },
        ];
      }),
    ),
    pressure: {
      available: Boolean(pressure.available),
      standardIndex: finiteNumber(pressure.standardIndex),
      extendedIndex: finiteNumber(pressure.extendedIndex),
      combinedIndex: finiteNumber(pressure.combinedIndex),
      levels: Array.isArray(pressure.levels)
        ? pressure.levels.slice(0, 2).flatMap((levelValue) => {
            const level = objectValue(levelValue);
            if (!['standard', 'extended'].includes(level.id)) return [];
            return [{
              id: level.id,
              index: finiteNumber(level.index),
              workerCount: finiteNumber(level.workerCount),
              memoryPressureMB: finiteNumber(level.memoryPressureMB),
              storagePressureMB: finiteNumber(level.storagePressureMB),
              components: Array.isArray(level.components)
                ? level.components.slice(0, 6).flatMap((componentValue) => {
                    const component = objectValue(componentValue);
                    if (!shadowPressureComponents.includes(component.id)) return [];
                    return [{
                      id: component.id,
                      index: finiteNumber(component.index),
                      weight: finiteNumber(component.weight),
                    }];
                  })
                : [],
            }];
          })
        : [],
    },
  };
}

function compactRawTiers(raw, key) {
  const tiers = objectValue(raw)[key];
  if (!Array.isArray(tiers)) return [];
  return tiers.map((tierValue) => {
    const tier = objectValue(tierValue);
    const compact = {};
    for (const [name, value] of Object.entries(tier)) {
      if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        (typeof value === "string" && value.length <= 80)
      ) {
        compact[name] = value;
      }
    }
    if (Array.isArray(tier.samples)) {
      compact.samples = tier.samples.map((sampleValue) => {
        const sample = objectValue(sampleValue);
        const sampleMetrics = {};
        for (const [name, value] of Object.entries(sample)) {
          if (typeof value === "number" || typeof value === "boolean") {
            sampleMetrics[name] = value;
          }
        }
        if (Array.isArray(sample.actions)) {
          sampleMetrics.actions = sample.actions.map((actionValue) => {
            const action = objectValue(actionValue);
            return {
              name: typeof action.name === "string" ? action.name : "unknown",
              durationMs: finiteNumber(action.durationMs),
              workMs: finiteNumber(action.workMs),
              presentationMs: finiteNumber(action.presentationMs),
            };
          });
        }
        return sampleMetrics;
      });
    }
    return compact;
  });
}

export function browserContext(userAgent = "", cadenceMs = 0, logicalProcessors = null) {
  const candidates = [
    ["Edge", /Edg\/(\d+)/],
    ["Opera", /(?:OPR|Opera)\/(\d+)/],
    ["Firefox", /(?:Firefox|FxiOS)\/(\d+)/],
    ["Chromium", /(?:Chrome|CriOS)\/(\d+)/],
    ["Safari", /Version\/(\d+).+Safari/],
  ];
  const match = candidates
    .map(([family, expression]) => ({ family, match: userAgent.match(expression) }))
    .find((candidate) => candidate.match);
  const platformFamily = /CrOS/i.test(userAgent)
    ? "ChromeOS"
    : /Android/i.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(userAgent)
        ? "iOS"
        : /Windows/i.test(userAgent)
          ? "Windows"
          : /Macintosh|Mac OS X/i.test(userAgent)
            ? "macOS"
            : /Linux/i.test(userAgent)
              ? "Linux"
              : "Other";
  const cores = finiteNumber(logicalProcessors);

  return {
    browserFamily: match?.family ?? "Other",
    browserMajor: match?.match?.[1] ?? null,
    platformFamily,
    logicalProcessorsBucket:
      cores === null
        ? "unknown"
        : cores >= 24
          ? "24+"
          : cores >= 16
            ? "16-23"
            : cores >= 12
              ? "12-15"
              : cores >= 8
                ? "8-11"
                : cores >= 6
                  ? "6-7"
                  : cores >= 4
                    ? "4-5"
                    : cores >= 2
                      ? "2-3"
                      : "1",
    displayCadenceBucket:
      cadenceMs <= 0
        ? "unknown"
        : cadenceMs <= 9
          ? "111hz+"
          : cadenceMs <= 13
            ? "77-110hz"
            : cadenceMs <= 19
              ? "53-76hz"
              : "52hz-or-less",
  };
}

export function buildAnonymousTelemetry(envelope, userAgent = "") {
  const root = objectValue(envelope);
  const result = objectValue(root.result);
  const raw = objectValue(result.raw);
  const categories = Object.fromEntries(
    categoryNames.map((name) => [name, compactCategory(result[name])]),
  );
  const responsiveness = objectValue(result.responsiveness);
  const headroom = objectValue(result.headroom);
  const upperReserve = objectValue(result.upperReserve);
  const upperReserveRun = objectValue(raw.upperReserveRun);
  const memory = objectValue(result.memory);
  const mixedReserve = objectValue(raw.mixedReserve);

  return {
    schemaVersion: "stillgood-telemetry.v1",
    resultSchemaVersion:
      typeof root.schemaVersion === "string" ? root.schemaVersion : "unknown",
    profileVersion:
      typeof result.profileVersion === "string" ? result.profileVersion : "unknown",
    context: {
      ...browserContext(userAgent, result.cadenceMs, result.logicalProcessors),
      formFactor:
        ["mobile", "computer", "unknown"].includes(result.formFactor)
          ? result.formFactor
          : "unknown",
      reportedMemoryClass:
        memory.reportedMemoryGB === 2
          ? "2"
          : memory.reportedMemoryGB === 4
            ? "4"
            : memory.reportedMemoryGB === 8
              ? "8+"
              : "unknown",
    },
    outcome: {
      score: finiteNumber(result.score),
      grade: typeof result.grade === "string" ? result.grade : null,
      confidence: typeof result.confidence === "string" ? result.confidence : null,
      elapsedMs: finiteNumber(result.elapsedMs),
      recoveryMs: finiteNumber(result.recoveryMs),
      longTaskCount: finiteNumber(result.longTaskCount),
      longAnimationFrameCount: finiteNumber(result.longAnimationFrameCount),
      responsiveness: {
        score: finiteNumber(responsiveness.score),
        p50Ms: finiteNumber(responsiveness.p50Ms),
        p95Ms: finiteNumber(responsiveness.p95Ms),
        p99Ms: finiteNumber(responsiveness.p99Ms),
        worstMs: finiteNumber(responsiveness.worstMs),
        hitch250Ratio: finiteNumber(responsiveness.hitch250Ratio),
        hitch500Ratio: finiteNumber(responsiveness.hitch500Ratio),
        blockingBurdenRatio: finiteNumber(responsiveness.blockingBurdenRatio),
      },
      headroom: {
        score: finiteNumber(headroom.score),
        openCeilings: finiteNumber(headroom.openCeilings),
        extendedCategories: finiteNumber(headroom.extendedCategories),
      },
      upperReserve: {
        tested: Boolean(upperReserve.tested),
        score: finiteNumber(upperReserve.score),
        gradeCeiling: finiteNumber(upperReserve.gradeCeiling),
        components: Array.isArray(upperReserve.components)
          ? upperReserve.components.slice(0, 9).flatMap((componentValue) => {
              const component = objectValue(componentValue);
              if (
                typeof component.id !== "string" ||
                !reserveComponents.includes(component.id)
              ) {
                return [];
              }
              return [
                {
                  id: component.id,
                  score: finiteNumber(component.score),
                },
              ];
            })
          : [],
      },
      reserveExecution: {
        attempted: Boolean(upperReserveRun.triggered),
        status: [
          "not-qualified",
          "started",
          "completed",
          "completed-with-fallback",
          "failed",
        ].includes(upperReserveRun.status)
          ? upperReserveRun.status
          : "unknown",
        phase: [
          "not-started",
          "component-preflight",
          "advanced-baseline",
          "paired-baseline",
          "pressure-setup",
          "paired-loaded",
          "cleanup",
          "complete",
        ].includes(upperReserveRun.phase)
          ? upperReserveRun.phase
          : "unknown",
        failureCode: [
          "worker-runtime",
          "timeout",
          "storage-runtime",
          "unknown-runtime",
        ].includes(upperReserveRun.failureCode)
          ? upperReserveRun.failureCode
          : null,
      },
      mixedReserve: {
        tested: Boolean(mixedReserve.tested),
        durationMs: finiteNumber(mixedReserve.durationMs),
        baselineP95Ms: finiteNumber(mixedReserve.baselineP95Ms),
        loadedP95Ms: finiteNumber(mixedReserve.loadedP95Ms),
        loadedWorstMs: finiteNumber(mixedReserve.loadedWorstMs),
        slowdownRatio: finiteNumber(mixedReserve.slowdownRatio),
        actionCount: finiteNumber(mixedReserve.actionCount),
        hitch250Ratio: finiteNumber(mixedReserve.hitch250Ratio),
        hitch500Ratio: finiteNumber(mixedReserve.hitch500Ratio),
        onTimeRatio: finiteNumber(mixedReserve.onTimeRatio),
        longFrameRatio: finiteNumber(mixedReserve.longFrameRatio),
        worstFrameMs: finiteNumber(mixedReserve.worstFrameMs),
        videoDroppedRatio: finiteNumber(mixedReserve.videoDroppedRatio),
        imageEditP95Ms: finiteNumber(mixedReserve.imageEditP95Ms),
        imageEditAvailable: Boolean(mixedReserve.imageEditAvailable),
        pdfP95Ms: finiteNumber(mixedReserve.pdfP95Ms),
        pdfAvailable: Boolean(mixedReserve.pdfAvailable),
        pdfBuild: ["modern", "legacy", "legacy-safe"].includes(mixedReserve.pdfBuild)
          ? mixedReserve.pdfBuild
          : null,
        pdfFailureStage: [
          "modern-load",
          "modern-render",
          "legacy-load",
          "legacy-render",
          "legacy-safe-load",
          "legacy-safe-render",
        ].includes(mixedReserve.pdfFailureStage)
          ? mixedReserve.pdfFailureStage
          : null,
        fallbackUsed: Boolean(mixedReserve.fallbackUsed),
        advancedAvailable: Boolean(mixedReserve.advancedAvailable),
        advancedBaselineP95Ms: finiteNumber(mixedReserve.advancedBaselineP95Ms),
        advancedLoadedP95Ms: finiteNumber(mixedReserve.advancedLoadedP95Ms),
        advancedWorstMs: finiteNumber(mixedReserve.advancedWorstMs),
        advancedSlowdownRatio: finiteNumber(mixedReserve.advancedSlowdownRatio),
        advancedBaselineStartupMs: finiteNumber(mixedReserve.advancedBaselineStartupMs),
        advancedStartupMs: finiteNumber(mixedReserve.advancedStartupMs),
        advancedCombinedMedianMs: finiteNumber(mixedReserve.advancedCombinedMedianMs),
        advancedSqliteP95Ms: finiteNumber(mixedReserve.advancedSqliteP95Ms),
        advancedParserP95Ms: finiteNumber(mixedReserve.advancedParserP95Ms),
        advancedJsonP95Ms: finiteNumber(mixedReserve.advancedJsonP95Ms),
        advancedBaselineIterations: finiteNumber(
          mixedReserve.advancedBaselineIterations,
        ),
        advancedIterations: finiteNumber(mixedReserve.advancedIterations),
        memoryPressureMB: finiteNumber(mixedReserve.memoryPressureMB),
        storagePressureMB: finiteNumber(mixedReserve.storagePressureMB),
        paired: Boolean(mixedReserve.paired),
        levels: Array.isArray(mixedReserve.levels)
          ? mixedReserve.levels.slice(0, 2).flatMap((levelValue) => {
              const level = objectValue(levelValue);
              if (!["standard", "extended"].includes(level.id)) return [];
              return [{
                id: level.id,
                baselineP95Ms: finiteNumber(level.baselineP95Ms),
                loadedP95Ms: finiteNumber(level.loadedP95Ms),
                loadedWorstMs: finiteNumber(level.loadedWorstMs),
                slowdownRatio: finiteNumber(level.slowdownRatio),
                onTimeRatio: finiteNumber(level.onTimeRatio),
                memoryPressureMB: finiteNumber(level.memoryPressureMB),
                storagePressureMB: finiteNumber(level.storagePressureMB),
                workerCount: finiteNumber(level.workerCount),
                pdfP95Ms: finiteNumber(level.pdfP95Ms),
                imageEditAvailable: Boolean(level.imageEditAvailable),
                pdfAvailable: Boolean(level.pdfAvailable),
                pdfBuild: ["modern", "legacy", "legacy-safe"].includes(level.pdfBuild)
                  ? level.pdfBuild
                  : null,
                pdfFailureStage: [
                  "modern-load",
                  "modern-render",
                  "legacy-load",
                  "legacy-render",
                  "legacy-safe-load",
                  "legacy-safe-render",
                ].includes(level.pdfFailureStage)
                  ? level.pdfFailureStage
                  : null,
                advancedAvailable: Boolean(level.advancedAvailable),
                advancedBaselineP95Ms: finiteNumber(level.advancedBaselineP95Ms),
                advancedLoadedP95Ms: finiteNumber(level.advancedLoadedP95Ms),
                advancedWorstMs: finiteNumber(level.advancedWorstMs),
                advancedSlowdownRatio: finiteNumber(level.advancedSlowdownRatio),
                advancedBaselineStartupMs: finiteNumber(level.advancedBaselineStartupMs),
                advancedStartupMs: finiteNumber(level.advancedStartupMs),
                advancedCombinedMedianMs: finiteNumber(level.advancedCombinedMedianMs),
                advancedSqliteP95Ms: finiteNumber(level.advancedSqliteP95Ms),
                advancedParserP95Ms: finiteNumber(level.advancedParserP95Ms),
                advancedJsonP95Ms: finiteNumber(level.advancedJsonP95Ms),
                advancedBaselineIterations: finiteNumber(
                  level.advancedBaselineIterations,
                ),
                advancedIterations: finiteNumber(level.advancedIterations),
              }];
            })
          : [],
      },
      boundaryConfirmation: compactBoundaryConfirmation(
        result.boundaryConfirmation,
      ),
      categories,
    },
    evidence: Object.fromEntries(
      [
        "browsingTiers",
        "emailTiers",
        "writingTiers",
        "spreadsheetTiers",
        "graphicsTiers",
        "videoTiers",
        "multitaskTiers",
        "memoryTiers",
        "storageTiers",
        "strictStorageTiers",
        "opfsStorageTiers",
      ].map((key) => [key, compactRawTiers(raw, key)]),
    ),
    shadow: compactShadowScoring(result.shadowScoring),
    integrity: {
      baselineUnsettled: Boolean(objectValue(raw.preflightBaseline).final?.unsettled),
      interruptionCount: Array.isArray(result.integrityNotes)
        ? result.integrityNotes.length
        : 0,
      longTaskSupported: Boolean(raw.longTaskSupported),
      longAnimationFrameSupported: Boolean(raw.longAnimationFrameSupported),
      memorySupported: Boolean(raw.memorySupported),
      memoryCapacityProbeCapped: Boolean(raw.memoryCapacityProbeCapped),
      storageAvailable: Boolean(raw.storageAvailable),
      strictStorageAvailable: Boolean(raw.strictStorageAvailable),
    },
  };
}
