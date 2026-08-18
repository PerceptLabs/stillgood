import { execFileSync } from "node:child_process";
import { summarizeThoroughRun } from "../lib/scoring.mjs";
import { planUpperReserve } from "../lib/upper-reserve.mjs";

const targetIds = process.argv.slice(2);
const ids = targetIds.length
  ? targetIds
  : [
      "0f58f852-44a1-479d-8f0d-15f2e0c62137",
      "84154212-08f5-4cb0-a3d1-7845aefbd2c7",
      "97cf8001-4cd4-4c49-9bac-044cb5e5e3a3",
    ];

function query(command) {
  const output = execFileSync(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "d1",
      "execute",
      "stillgood-telemetry",
      "--remote",
      "--config",
      "wrangler.public.jsonc",
      "--command",
      command,
      "--json",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  return JSON.parse(output)[0]?.results ?? [];
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function memoryClass(value) {
  if (value === "2") return 2;
  if (value === "4") return 4;
  if (value === "8+") return 8;
  return null;
}

function replay(payload, reserveEvaluationComplete) {
  const outcome = payload.outcome ?? {};
  const evidence = payload.evidence ?? {};
  const integrity = payload.integrity ?? {};
  return summarizeThoroughRun({
    browserFamily: payload.context?.browserFamily,
    browsingTiers: evidence.browsingTiers ?? [],
    emailTiers: evidence.emailTiers ?? [],
    writingTiers: evidence.writingTiers ?? [],
    spreadsheetTiers: evidence.spreadsheetTiers ?? [],
    graphicsTiers: evidence.graphicsTiers ?? [],
    videoTiers: evidence.videoTiers ?? [],
    multitaskTiers: evidence.multitaskTiers ?? [],
    memoryTiers: evidence.memoryTiers ?? [],
    memorySupported: integrity.memorySupported,
    memoryCapacityProbeCapped: integrity.memoryCapacityProbeCapped,
    reportedMemoryGB: memoryClass(payload.context?.reportedMemoryClass),
    storageTiers: evidence.storageTiers ?? [],
    strictStorageTiers: evidence.strictStorageTiers ?? [],
    opfsStorageTiers: evidence.opfsStorageTiers ?? [],
    storageAvailable: integrity.storageAvailable,
    strictStorageAvailable: integrity.strictStorageAvailable,
    recoveryMs: outcome.recoveryMs,
    longTaskCount: outcome.longTaskCount,
    longAnimationFrameCount: outcome.longAnimationFrameCount,
    measuredActiveMs: outcome.elapsedMs,
    longTaskSupported: integrity.longTaskSupported,
    longAnimationFrameSupported: integrity.longAnimationFrameSupported,
    interruptionCount: integrity.interruptionCount,
    baselineUnsettled: integrity.baselineUnsettled,
    mixedReserve: outcome.mixedReserve?.tested
      ? outcome.mixedReserve
      : null,
    reserveEvaluationComplete,
  });
}

for (const id of ids) {
  const [row] = query(
    `SELECT id, created_at, platform_family, score, grade, payload_json FROM anonymous_benchmark_runs WHERE id = ${sqlString(id)} LIMIT 1`,
  );
  if (!row) {
    console.log(`${id}: not found`);
    continue;
  }
  const payload = JSON.parse(row.payload_json);
  const preliminary = replay(payload, false);
  const final = replay(payload, true);
  const plan = planUpperReserve(preliminary);
  const categories = [
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
  console.log(
    JSON.stringify(
      {
        id: row.id,
        device: row.platform_family,
        original: `${row.score} ${row.grade}`,
        replay: `${final.score} ${final.grade}`,
        preliminary: preliminary.score,
        internalScoring: final.internalScoring
          ? {
              baseBeforeReserve: final.internalScoring.baseBeforeReserve,
              baseAfterReserveCap: final.internalScoring.baseAfterReserveCap,
              reserveAward: final.internalScoring.reserveAward,
              final: final.internalScoring.final,
            }
          : null,
        reserve: {
          planned: plan.needed,
          reason: plan.reason,
          legacyEvidence: final.upperReserve.tested,
          score: final.upperReserve.score,
        },
        responsivenessP95Ms: preliminary.responsiveness.p95Ms,
        webExperience: preliminary.evidenceGroups?.webExperience?.score,
        resourceResilience:
          preliminary.evidenceGroups?.resourceResilience?.score,
        headroom: preliminary.headroom.score,
        categories: Object.fromEntries(
          categories.map((name) => [name, preliminary[name]?.score]),
        ),
      },
      null,
      2,
    ),
  );
}
