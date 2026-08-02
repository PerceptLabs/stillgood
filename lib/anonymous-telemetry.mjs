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
  const memory = objectValue(result.memory);

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
    integrity: {
      baselineUnsettled: Boolean(objectValue(raw.preflightBaseline).final?.unsettled),
      interruptionCount: Array.isArray(result.integrityNotes)
        ? result.integrityNotes.length
        : 0,
      longTaskSupported: Boolean(raw.longTaskSupported),
      longAnimationFrameSupported: Boolean(raw.longAnimationFrameSupported),
      memorySupported: Boolean(raw.memorySupported),
      storageAvailable: Boolean(raw.storageAvailable),
      strictStorageAvailable: Boolean(raw.strictStorageAvailable),
    },
  };
}
