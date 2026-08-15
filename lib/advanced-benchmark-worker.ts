/// <reference lib="webworker" />

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { parse } from "acorn";
import {
  buildJsonRecords,
  buildParserSource,
} from "./advanced-workloads.mjs";

type AdvancedRequest = {
  type: "advanced-web-work";
  requestId: string;
  level: "baseline" | "standard" | "extended";
  minimumDurationMs?: number;
};

type WorkloadSamples = {
  sqlite: number[];
  parser: number[];
  json: number[];
  combined: number[];
};

const workerScope = self as unknown as DedicatedWorkerGlobalScope;
const cancelled = new Set<string>();

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function summarize(samples: WorkloadSamples) {
  const metrics = Object.fromEntries(
    Object.entries(samples).map(([name, values]) => [
      name,
      {
        medianMs: percentile(values, 0.5),
        p95Ms: percentile(values, 0.95),
        worstMs: Math.max(...values, 0),
      },
    ]),
  );
  return metrics as Record<keyof WorkloadSamples, {
    medianMs: number;
    p95Ms: number;
    worstMs: number;
  }>;
}

async function runAdvancedWebWork(request: AdvancedRequest) {
  const levelIndex = request.level === "extended" ? 2 : request.level === "standard" ? 1 : 0;
  const rowCount = [7000, 11000, 16000][levelIndex];
  const jsonCount = [7000, 11000, 16000][levelIndex];
  const parserModules = [180, 260, 360][levelIndex];
  const minimumIterations = [4, 6, 8][levelIndex];
  const source = buildParserSource(parserModules, 8100 + levelIndex);
  const jsonRecords = buildJsonRecords(jsonCount, 8200 + levelIndex);
  const samples: WorkloadSamples = { sqlite: [], parser: [], json: [], combined: [] };
  let checksum = 0;

  const startupStarted = performance.now();
  const sqlite3 = await sqlite3InitModule();
  const database = new sqlite3.oo1.DB(":memory:", "c");
  database.exec(
    "PRAGMA journal_mode=MEMORY; PRAGMA synchronous=OFF; " +
      "CREATE TABLE work_items(" +
      "id INTEGER PRIMARY KEY, folder TEXT, title TEXT, state TEXT, score INTEGER, body TEXT); " +
      "CREATE INDEX work_items_folder_score ON work_items(folder, score DESC);",
  );
  const statement = database.prepare(
    "INSERT INTO work_items(id, folder, title, state, score, body) VALUES(?1, ?2, ?3, ?4, ?5, ?6)",
  );
  database.exec("BEGIN");
  try {
    for (let index = 0; index < rowCount; index += 1) {
      statement
        .bind([
          index + 1,
          `folder-${index % 37}`,
          `Service record ${index} for device ${(index * 13) % 997}`,
          ["ready", "review", "repair", "archive"][index % 4],
          (index * 47 + 31) % 1000,
          "Battery display keyboard storage network inspection notes and repair history.",
        ])
        .stepReset();
    }
  } finally {
    statement.finalize();
    database.exec("COMMIT");
  }
  const startupMs = performance.now() - startupStarted;
  const began = performance.now();
  let iteration = 0;
  try {
    while (
      !cancelled.has(request.requestId) &&
      (iteration < minimumIterations || performance.now() - began < (request.minimumDurationMs ?? 0))
    ) {
      const combinedStarted = performance.now();

      const sqliteStarted = performance.now();
      database.exec(
        `UPDATE work_items SET score = (score + ${iteration + 3}) % 1000 ` +
          `WHERE id % 97 = ${iteration % 17};`,
      );
      const grouped = database.exec({
        sql:
          "SELECT folder, COUNT(*) AS items, ROUND(AVG(score), 2) AS average_score " +
          "FROM work_items WHERE state <> 'archive' GROUP BY folder " +
          "ORDER BY average_score DESC LIMIT 18",
        rowMode: "object",
        returnValue: "resultRows",
      });
      const searched = database.exec({
        sql:
          `SELECT id, title, score FROM work_items ` +
          `WHERE title LIKE '%device ${((iteration + 2) * 13) % 997}%' ` +
          `OR body LIKE '%storage%' ORDER BY score DESC LIMIT 90`,
        rowMode: "object",
        returnValue: "resultRows",
      });
      samples.sqlite.push(performance.now() - sqliteStarted);
      checksum = (checksum + grouped.length * 31 + searched.length * 17) >>> 0;

      const parserStarted = performance.now();
      const syntaxTree = parse(source, { ecmaVersion: "latest", sourceType: "module" });
      samples.parser.push(performance.now() - parserStarted);
      checksum = (checksum + syntaxTree.body.length * 13) >>> 0;

      const jsonStarted = performance.now();
      const serialized = JSON.stringify({
        revision: iteration,
        generatedAt: "2026-01-01T00:00:00.000Z",
        records: jsonRecords,
      });
      const restored = JSON.parse(serialized) as { records: Array<{ score: number }> };
      let scoreTotal = 0;
      for (let index = iteration % 11; index < restored.records.length; index += 19) {
        scoreTotal += restored.records[index].score;
      }
      samples.json.push(performance.now() - jsonStarted);
      checksum = (checksum + serialized.length + scoreTotal) >>> 0;

      samples.combined.push(performance.now() - combinedStarted);
      iteration += 1;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    database.close();
    cancelled.delete(request.requestId);
  }
  return {
    type: "advanced-web-work-complete",
    requestId: request.requestId,
    level: request.level,
    available: true,
    sqliteVersion: sqlite3.version.libVersion,
    startupMs,
    elapsedMs: performance.now() - began,
    iterations: iteration,
    checksum,
    samples,
    summary: summarize(samples),
  };
}

workerScope.addEventListener("message", (event: MessageEvent<AdvancedRequest | { type: "cancel-advanced"; requestId: string }>) => {
  const request = event.data;
  if (request.type === "cancel-advanced") {
    cancelled.add(request.requestId);
    return;
  }
  if (request.type !== "advanced-web-work") return;
  void runAdvancedWebWork(request)
    .then((result) => workerScope.postMessage(result))
    .catch((error: unknown) => {
      workerScope.postMessage({
        type: "advanced-web-work-complete",
        requestId: request.requestId,
        level: request.level,
        available: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });
});

export {};
