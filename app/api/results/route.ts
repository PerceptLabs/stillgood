import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { benchmarkRuns } from "@/db/schema";

export const dynamic = "force-dynamic";

const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const MAX_RESULT_BYTES = 1_500_000;

type StoredEnvelope = {
  schemaVersion?: unknown;
  result?: Record<string, unknown>;
  disclosure?: unknown;
};

function authenticatedEmail(request: Request) {
  return request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase() ?? "";
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function nestedObject(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export async function GET(request: Request) {
  const userEmail = authenticatedEmail(request);
  if (!userEmail)
    return Response.json({ error: "Authentication required" }, { status: 401 });

  try {
    const db = getDb();
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (id) {
      const [row] = await db
        .select({ resultJson: benchmarkRuns.resultJson })
        .from(benchmarkRuns)
        .where(
          and(
            eq(benchmarkRuns.id, id),
            eq(benchmarkRuns.userEmail, userEmail),
          ),
        )
        .limit(1);
      if (!row)
        return Response.json({ error: "Saved run not found" }, { status: 404 });
      return Response.json(JSON.parse(row.resultJson));
    }

    const runs = await db
      .select({
        id: benchmarkRuns.id,
        createdAt: benchmarkRuns.createdAt,
        startedAt: benchmarkRuns.startedAt,
        schemaVersion: benchmarkRuns.schemaVersion,
        profileVersion: benchmarkRuns.profileVersion,
        grade: benchmarkRuns.grade,
        score: benchmarkRuns.score,
        confidence: benchmarkRuns.confidence,
        browser: benchmarkRuns.browser,
        platform: benchmarkRuns.platform,
        logicalProcessors: benchmarkRuns.logicalProcessors,
        elapsedMs: benchmarkRuns.elapsedMs,
        responsivenessLabel: benchmarkRuns.responsivenessLabel,
        responsivenessScore: benchmarkRuns.responsivenessScore,
        headroomLabel: benchmarkRuns.headroomLabel,
        headroomScore: benchmarkRuns.headroomScore,
      })
      .from(benchmarkRuns)
      .where(eq(benchmarkRuns.userEmail, userEmail))
      .orderBy(desc(benchmarkRuns.createdAt), desc(benchmarkRuns.startedAt))
      .limit(100);

    return Response.json({ runs });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load saved runs",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const userEmail = authenticatedEmail(request);
  if (!userEmail)
    return Response.json({ error: "Authentication required" }, { status: 401 });

  try {
    const payload = (await request.json()) as StoredEnvelope;
    const result = nestedObject(payload.result);
    const responsiveness = nestedObject(result.responsiveness);
    const headroom = nestedObject(result.headroom);
    const schemaVersion = textValue(payload.schemaVersion);
    const startedAt = textValue(result.startedAt);
    const profileVersion = textValue(result.profileVersion);
    const grade = textValue(result.grade);
    const browser = textValue(result.browser, "Browser not reported");
    const platform = textValue(result.platform, "Platform not reported");

    if (
      !schemaVersion.startsWith("stillgood-result.") ||
      !startedAt ||
      !profileVersion ||
      !grade
    ) {
      return Response.json(
        { error: "This is not a complete StillGood result" },
        { status: 400 },
      );
    }

    const resultJson = JSON.stringify(payload);
    if (new TextEncoder().encode(resultJson).byteLength > MAX_RESULT_BYTES) {
      return Response.json(
        { error: "Result log is unexpectedly large" },
        { status: 413 },
      );
    }

    const db = getDb();
    const [existing] = await db
      .select({ id: benchmarkRuns.id })
      .from(benchmarkRuns)
      .where(
        and(
          eq(benchmarkRuns.userEmail, userEmail),
          eq(benchmarkRuns.startedAt, startedAt),
          eq(benchmarkRuns.profileVersion, profileVersion),
        ),
      )
      .limit(1);
    if (existing) return Response.json({ id: existing.id, saved: true });

    const id = crypto.randomUUID();
    await db.insert(benchmarkRuns).values({
      id,
      userEmail,
      startedAt,
      schemaVersion,
      profileVersion,
      grade,
      score: numberValue(result.score),
      confidence: textValue(result.confidence, "Unknown"),
      browser,
      platform,
      logicalProcessors:
        typeof result.logicalProcessors === "number"
          ? numberValue(result.logicalProcessors)
          : null,
      elapsedMs: numberValue(result.elapsedMs),
      responsivenessLabel: textValue(
        responsiveness.label,
        "Not measured",
      ),
      responsivenessScore:
        typeof responsiveness.score === "number"
          ? numberValue(responsiveness.score)
          : null,
      headroomLabel: textValue(headroom.label, "Not measured"),
      headroomScore: numberValue(headroom.score),
      resultJson,
    });

    return Response.json({ id, saved: true }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save this run",
      },
      { status: 500 },
    );
  }
}

