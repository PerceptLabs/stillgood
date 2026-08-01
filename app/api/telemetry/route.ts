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
const TIER_NUMBER_FIELDS = new Set([
  "size",
  "domRows",
  "complexity",
  "durationMs",
  "workMs",
  "presentationMs",
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
  "droppedRatio",
  "stalls",
  "stallDurationMs",
  "longestStallMs",
  "totalFrames",
  "mediaAdvancedMs",
  "targetMB",
  "retainedMB",
  "allocationMs",
  "scanMs",
  "scannedMB",
  "sweepMBps",
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
  "foregroundP95Ms",
  "foregroundWorstMs",
]);
const TIER_BOOLEAN_FIELDS = new Set([
  "earlyStopped",
  "valid",
  "completed",
  "verified",
  "available",
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

function sanitizeSubmission(payload: unknown) {
  const root = objectValue(payload);
  if (root.schemaVersion !== "stillgood-telemetry.v1") {
    throw new Error("Unsupported telemetry schema");
  }
  const context = objectValue(root.context);
  const outcome = objectValue(root.outcome);
  const responsiveness = objectValue(outcome.responsiveness);
  const headroom = objectValue(outcome.headroom);
  const categories = objectValue(outcome.categories);
  const evidence = objectValue(root.evidence);
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
