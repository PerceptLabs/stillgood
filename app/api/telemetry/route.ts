import { getDb } from "@/db";
import { anonymousBenchmarkRuns } from "@/db/schema";

export const dynamic = "force-dynamic";

const MAX_TELEMETRY_BYTES = 500_000;
const CATEGORY_NAMES = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "graphics",
  "video",
  "multitasking",
  "memory",
  "storage",
] as const;
const CONFIRMATION_CATEGORIES = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "multitasking",
] as const;
const CONFIRMATION_REASONS = [
  "grade-boundary",
  "capability-boundary",
  "low-confidence",
  "not-near-boundary",
  "no-summary",
] as const;
const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "E"] as const;
const EVIDENCE_NAMES = [
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
] as const;
const SHADOW_CATEGORY_NAMES = [
  "browsing",
  "email",
  "writing",
  "spreadsheets",
  "multitasking",
] as const;
const SHADOW_PRESSURE_COMPONENTS = [
  "foreground-latency",
  "tail-latency",
  "slowdown-resilience",
  "frame-delivery",
  "advanced-throughput",
  "advanced-latency",
] as const;
const TIER_NUMBER_FIELDS = new Set([
  "size",
  "domRows",
  "complexity",
  "durationMs",
  "workMs",
  "presentationMs",
  "setupMs",
  "setupWorkMs",
  "setupPresentationMs",
  "checksum",
  "onTimeRatio",
  "longFrameRatio",
  "worstFrameMs",
  "frameCount",
  "expectedFrameCount",
  "displayCadenceMs",
  "evaluationCadenceMs",
  "width",
  "height",
  "frameRate",
  "bitrate",
  "confirmationRuns",
  "initialDroppedRatio",
  "droppedRatio",
  "stalls",
  "stallDurationMs",
  "longestStallMs",
  "totalFrames",
  "mediaAdvancedMs",
  "targetMB",
  "retainedMB",
  "addedMB",
  "allocationMs",
  "scanMs",
  "scannedMB",
  "sweepMBps",
  "gcChurnMs",
  "gcWorstRoundMs",
  "gcObjectsCreated",
  "copyRoundTripMs",
  "probeP95Ms",
  "probeWorstMs",
  "sizeMB",
  "writeMs",
  "readMs",
  "transactionCount",
  "payloadKB",
  "medianCommitMs",
  "p95CommitMs",
  "worstCommitMs",
  "readbackMs",
  "randomReads",
  "flushMs",
  "reopenMs",
  "randomReadMs",
  "flushP95Ms",
  "flushWorstMs",
  "coldWriteMs",
  "coldFlushMs",
  "coldReopenMs",
  "coldRandomReadMs",
  "foregroundP95Ms",
  "foregroundWorstMs",
]);
const TIER_BOOLEAN_FIELDS = new Set([
  "earlyStopped",
  "valid",
  "completed",
  "verified",
  "available",
  "headroom",
  "skipped",
  "capabilitySupported",
  "capabilitySmooth",
  "capabilityPowerEfficient",
]);

type JsonObject = Record<string, unknown>;

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" ? (value as JsonObject) : {};
}

function finiteNumber(value: unknown, fallback: number | null = null) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function constrainedString(
  value: unknown,
  allowed: readonly string[],
  fallback: string,
) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function optionalConstrainedString(value: unknown, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function versionString(value: unknown, fallback = "unknown") {
  return typeof value === "string" && /^[a-z0-9._-]{1,80}$/i.test(value)
    ? value
    : fallback;
}

function sanitizeCategory(value: unknown) {
  const category = objectValue(value);
  const tiers = Array.isArray(category.tiers) ? category.tiers : [];
  return {
    score: finiteNumber(category.score),
    available:
      typeof category.available === "boolean" ? category.available : null,
    highestComfortable: versionString(category.highestComfortable, "unknown"),
    highestUsable: versionString(category.highestUsable, "unknown"),
    testedHeadroom:
      typeof category.testedHeadroom === "boolean"
        ? category.testedHeadroom
        : null,
    limitFound:
      typeof category.limitFound === "boolean" ? category.limitFound : null,
    headroomCeiling:
      typeof category.headroomCeiling === "boolean"
        ? category.headroomCeiling
        : null,
    tiers: tiers.slice(0, 12).map((value) => {
      const tier = objectValue(value);
      return {
        id: versionString(tier.id, "unknown"),
        medianMs: finiteNumber(tier.medianMs),
        worstMs: finiteNumber(tier.worstMs),
        cv: finiteNumber(tier.cv),
        score: finiteNumber(tier.score),
        status: versionString(tier.status, "unknown"),
        earlyStopped:
          typeof tier.earlyStopped === "boolean" ? tier.earlyStopped : null,
      };
    }),
  };
}

function sanitizeEvidenceTier(value: unknown) {
  const tier = objectValue(value);
  const clean: JsonObject = { id: versionString(tier.id, "unknown") };
  for (const [key, field] of Object.entries(tier)) {
    if (TIER_NUMBER_FIELDS.has(key)) clean[key] = finiteNumber(field);
    if (TIER_BOOLEAN_FIELDS.has(key) && typeof field === "boolean") {
      clean[key] = field;
    }
  }
  if (typeof tier.measurementSource === "string") {
    clean.measurementSource = constrainedString(
      tier.measurementSource,
      ["playback-quality", "frame-callback", "unavailable"],
      "unavailable",
    );
  }
  if (typeof tier.allocator === "string") {
    clean.allocator = constrainedString(
      tier.allocator,
      ["webassembly", "typed-array"],
      "typed-array",
    );
  }
  if (Array.isArray(tier.samples)) {
    clean.samples = tier.samples.slice(0, 12).map((sampleValue) => {
      const sample = objectValue(sampleValue);
      const cleanSample: JsonObject = {};
      for (const [key, field] of Object.entries(sample)) {
        if (TIER_NUMBER_FIELDS.has(key)) cleanSample[key] = finiteNumber(field);
        if (TIER_BOOLEAN_FIELDS.has(key) && typeof field === "boolean") {
          cleanSample[key] = field;
        }
      }
      if (Array.isArray(sample.actions)) {
        cleanSample.actions = sample.actions.slice(0, 24).map((actionValue) => {
          const action = objectValue(actionValue);
          return {
            durationMs: finiteNumber(action.durationMs),
            workMs: finiteNumber(action.workMs),
            presentationMs: finiteNumber(action.presentationMs),
          };
        });
      }
      return cleanSample;
    });
  }
  return clean;
}

function sanitizeBoundaryConfirmation(value: unknown) {
  const confirmation = objectValue(value);
  const plannedCategories = Array.isArray(confirmation.plannedCategories)
    ? confirmation.plannedCategories
        .filter(
          (category): category is (typeof CONFIRMATION_CATEGORIES)[number] =>
            typeof category === "string" &&
            CONFIRMATION_CATEGORIES.includes(
              category as (typeof CONFIRMATION_CATEGORIES)[number],
            ),
        )
        .slice(0, 3)
    : [];
  const runs = Array.isArray(confirmation.runs)
    ? confirmation.runs.slice(0, 3).flatMap((runValue) => {
        const run = objectValue(runValue);
        if (
          typeof run.category !== "string" ||
          !CONFIRMATION_CATEGORIES.includes(
            run.category as (typeof CONFIRMATION_CATEGORIES)[number],
          )
        ) {
          return [];
        }
        return [
          {
            category: run.category,
            tier: versionString(run.tier),
            addedSamples: finiteNumber(run.addedSamples),
          },
        ];
      })
    : [];

  return {
    triggered: Boolean(confirmation.triggered),
    reason: constrainedString(
      confirmation.reason,
      CONFIRMATION_REASONS,
      "not-near-boundary",
    ),
    margin: finiteNumber(confirmation.margin),
    gradeBoundary: finiteNumber(confirmation.gradeBoundary),
    plannedCategories,
    runs,
    scoreBefore: finiteNumber(confirmation.scoreBefore),
    gradeBefore: optionalConstrainedString(confirmation.gradeBefore, GRADES),
    scoreAfter: finiteNumber(confirmation.scoreAfter),
    gradeAfter: optionalConstrainedString(confirmation.gradeAfter, GRADES),
  };
}

function sanitizeShadowScoring(value: unknown) {
  const shadow = objectValue(value);
  const pressure = objectValue(shadow.pressure);
  const categories = objectValue(shadow.categories);
  const tierId = (value: unknown) =>
    typeof value === "string" && /^[a-z0-9_-]{1,40}$/i.test(value)
      ? value
      : null;

  return {
    version: versionString(shadow.version),
    status: constrainedString(shadow.status, ["shadow"], "unknown"),
    calibration: versionString(shadow.calibration),
    referenceIndex: finiteNumber(shadow.referenceIndex),
    publicScoreAffected: Boolean(shadow.publicScoreAffected),
    webIndex: finiteNumber(shadow.webIndex),
    pressureIndex: finiteNumber(shadow.pressureIndex),
    extendedPressureIndex: finiteNumber(shadow.extendedPressureIndex),
    systemIndex: finiteNumber(shadow.systemIndex),
    coverage: constrainedString(
      shadow.coverage,
      ["web-only", "web-and-standard-pressure"],
      "unknown",
    ),
    categories: Object.fromEntries(
      SHADOW_CATEGORY_NAMES.map((name) => {
        const category = objectValue(categories[name]);
        return [name, {
          index: finiteNumber(category.index),
          fixedWorkIndex: finiteNumber(category.fixedWorkIndex),
          capacityIndex: finiteNumber(category.capacityIndex),
          comfortableCapacity: finiteNumber(category.comfortableCapacity),
          referenceCapacity: finiteNumber(category.referenceCapacity),
          openCeiling: Boolean(category.openCeiling),
          ordinaryTierCount: finiteNumber(category.ordinaryTierCount),
          bracket: Array.isArray(category.bracket)
            ? category.bracket.slice(0, 2).map(tierId)
            : [],
        }];
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
                    if (
                      typeof component.id !== "string" ||
                      !SHADOW_PRESSURE_COMPONENTS.includes(
                        component.id as (typeof SHADOW_PRESSURE_COMPONENTS)[number],
                      )
                    ) return [];
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

function sanitizeSubmission(payload: unknown) {
  const root = objectValue(payload);
  if (root.schemaVersion !== "stillgood-telemetry.v1") {
    throw new Error("Unsupported telemetry schema");
  }
  const context = objectValue(root.context);
  const outcome = objectValue(root.outcome);
  const responsiveness = objectValue(outcome.responsiveness);
  const headroom = objectValue(outcome.headroom);
  const upperReserve = objectValue(outcome.upperReserve);
  const reserveExecution = objectValue(outcome.reserveExecution);
  const mixedReserve = objectValue(outcome.mixedReserve);
  const boundaryConfirmation = objectValue(outcome.boundaryConfirmation);
  const categories = objectValue(outcome.categories);
  const evidence = objectValue(root.evidence);
  const shadow = objectValue(root.shadow);
  const integrity = objectValue(root.integrity);

  const clean = {
    schemaVersion: "stillgood-telemetry.v1",
    resultSchemaVersion: versionString(root.resultSchemaVersion),
    profileVersion: versionString(root.profileVersion),
    context: {
      browserFamily: constrainedString(
        context.browserFamily,
        ["Chromium", "Edge", "Opera", "Firefox", "Safari", "Other"],
        "Other",
      ),
      browserMajor:
        typeof context.browserMajor === "string" && /^\d{1,4}$/.test(context.browserMajor)
          ? context.browserMajor
          : null,
      platformFamily: constrainedString(
        context.platformFamily,
        ["Windows", "ChromeOS", "Android", "iOS", "macOS", "Linux", "Other"],
        "Other",
      ),
      formFactor: constrainedString(
        context.formFactor,
        ["mobile", "computer", "unknown"],
        "unknown",
      ),
      reportedMemoryClass: constrainedString(
        context.reportedMemoryClass,
        ["unknown", "2", "4", "8+"],
        "unknown",
      ),
      logicalProcessorsBucket: constrainedString(
        context.logicalProcessorsBucket,
        ["unknown", "1", "2-3", "4-5", "6-7", "8-11", "12-15", "16-23", "24+"],
        "unknown",
      ),
      displayCadenceBucket: constrainedString(
        context.displayCadenceBucket,
        ["unknown", "111hz+", "77-110hz", "53-76hz", "52hz-or-less"],
        "unknown",
      ),
    },
    outcome: {
      score: finiteNumber(outcome.score, 0),
      grade: constrainedString(
        outcome.grade,
        ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "E"],
        "E",
      ),
      confidence: constrainedString(
        outcome.confidence,
        ["High", "Medium", "Low"],
        "Low",
      ),
      elapsedMs: finiteNumber(outcome.elapsedMs),
      recoveryMs: finiteNumber(outcome.recoveryMs),
      longTaskCount: finiteNumber(outcome.longTaskCount),
      longAnimationFrameCount: finiteNumber(outcome.longAnimationFrameCount),
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
                ![
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
                ].includes(component.id)
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
        attempted: Boolean(reserveExecution.attempted),
        status: constrainedString(
          reserveExecution.status,
          [
            "unknown",
            "not-qualified",
            "started",
            "completed",
            "completed-with-fallback",
            "failed",
          ],
          "unknown",
        ),
        phase: constrainedString(
          reserveExecution.phase,
          [
            "unknown",
            "not-started",
            "component-preflight",
            "advanced-baseline",
            "paired-baseline",
            "pressure-setup",
            "paired-loaded",
            "cleanup",
            "complete",
          ],
          "unknown",
        ),
        failureCode: optionalConstrainedString(
          reserveExecution.failureCode,
          [
            "worker-runtime",
            "timeout",
            "storage-runtime",
            "unknown-runtime",
          ],
        ),
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
        pdfBuild: optionalConstrainedString(
          mixedReserve.pdfBuild,
          ["modern", "legacy", "legacy-safe"],
        ),
        pdfFailureStage: optionalConstrainedString(
          mixedReserve.pdfFailureStage,
          [
            "modern-load",
            "modern-render",
            "legacy-load",
            "legacy-render",
            "legacy-safe-load",
            "legacy-safe-render",
          ],
        ),
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
              if (
                typeof level.id !== "string" ||
                !["standard", "extended"].includes(level.id)
              )
                return [];
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
                pdfBuild: optionalConstrainedString(
                  level.pdfBuild,
                  ["modern", "legacy", "legacy-safe"],
                ),
                pdfFailureStage: optionalConstrainedString(
                  level.pdfFailureStage,
                  [
                    "modern-load",
                    "modern-render",
                    "legacy-load",
                    "legacy-render",
                    "legacy-safe-load",
                    "legacy-safe-render",
                  ],
                ),
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
      boundaryConfirmation: sanitizeBoundaryConfirmation(boundaryConfirmation),
      categories: Object.fromEntries(
        CATEGORY_NAMES.map((name) => [name, sanitizeCategory(categories[name])]),
      ),
    },
    evidence: Object.fromEntries(
      EVIDENCE_NAMES.map((name) => [
        name,
        (Array.isArray(evidence[name]) ? evidence[name] : [])
          .slice(0, 12)
          .map(sanitizeEvidenceTier),
      ]),
    ),
    shadow: sanitizeShadowScoring(shadow),
    integrity: {
      baselineUnsettled: Boolean(integrity.baselineUnsettled),
      interruptionCount: finiteNumber(integrity.interruptionCount),
      longTaskSupported: Boolean(integrity.longTaskSupported),
      longAnimationFrameSupported: Boolean(integrity.longAnimationFrameSupported),
      memorySupported: Boolean(integrity.memorySupported),
      storageAvailable: Boolean(integrity.storageAvailable),
      strictStorageAvailable: Boolean(integrity.strictStorageAvailable),
    },
  };

  const score = clean.outcome.score ?? 0;
  if (score < 0 || score > 100 || clean.profileVersion === "unknown") {
    throw new Error("Incomplete benchmark outcome");
  }
  return clean;
}

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_TELEMETRY_BYTES) {
      return Response.json({ error: "Telemetry payload is too large" }, { status: 413 });
    }
    const clean = sanitizeSubmission(await request.json());
    const payloadJson = JSON.stringify(clean);
    if (new TextEncoder().encode(payloadJson).byteLength > MAX_TELEMETRY_BYTES) {
      return Response.json({ error: "Telemetry payload is too large" }, { status: 413 });
    }

    const db = getDb();
    await db.insert(anonymousBenchmarkRuns).values({
      id: crypto.randomUUID(),
      telemetryVersion: clean.schemaVersion,
      resultSchemaVersion: clean.resultSchemaVersion,
      profileVersion: clean.profileVersion,
      browserFamily: clean.context.browserFamily,
      browserMajor: clean.context.browserMajor,
      platformFamily: clean.context.platformFamily,
      formFactor: clean.context.formFactor,
      logicalProcessorsBucket: clean.context.logicalProcessorsBucket,
      displayCadenceBucket: clean.context.displayCadenceBucket,
      grade: clean.outcome.grade,
      score: Math.round(clean.outcome.score ?? 0),
      confidence: clean.outcome.confidence,
      payloadJson,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not store telemetry";
    const status =
      message.includes("schema") || message.includes("benchmark") ? 400 : 503;
    return Response.json(
      {
        error:
          status === 400
            ? message
            : "Anonymous measurement sharing is temporarily unavailable",
      },
      { status },
    );
  }
}
