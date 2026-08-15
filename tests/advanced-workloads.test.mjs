import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "acorn";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  buildBenchmarkPdf,
  buildJsonRecords,
  buildParserSource,
} from "../lib/advanced-workloads.mjs";

test("the advanced PDF fixture is valid, searchable, and deterministic", async () => {
  const first = buildBenchmarkPdf({ pageCount: 8, linesPerPage: 22, seed: 77 });
  const second = buildBenchmarkPdf({ pageCount: 8, linesPerPage: 22, seed: 77 });
  assert.deepEqual(first, second);
  assert.equal(new TextDecoder().decode(first.slice(0, 8)), "%PDF-1.4");

  const loadingTask = getDocument({ data: first, isEvalSupported: false });
  const document = await loadingTask.promise;
  try {
    assert.equal(document.numPages, 8);
    const text = await (await document.getPage(3)).getTextContent();
    const joined = text.items.map((item) => "str" in item ? item.str : "").join(" ");
    assert.match(joined, /SECOND-LIFE CHECKPOINT/);
    assert.match(joined, /battery display keyboard storage network/);
  } finally {
    await loadingTask.destroy();
  }
});

test("the parser and JSON fixtures create application-shaped work", () => {
  const source = buildParserSource(80, 13);
  const syntaxTree = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const records = buildJsonRecords(1400, 13);
  const restored = JSON.parse(JSON.stringify(records));

  assert.ok(source.length > 50000);
  assert.ok(syntaxTree.body.length > 150);
  assert.equal(restored.length, 1400);
  assert.deepEqual(restored[0], records[0]);
});

test("official SQLite WebAssembly executes indexed application queries", async () => {
  const sqlite3 = await sqlite3InitModule();
  const database = new sqlite3.oo1.DB(":memory:", "c");
  try {
    database.exec(
      "CREATE TABLE records(id INTEGER PRIMARY KEY, folder TEXT, score INTEGER);" +
      "CREATE INDEX records_folder_score ON records(folder, score DESC);" +
      "INSERT INTO records VALUES(1, 'ready', 72), (2, 'ready', 91), (3, 'review', 83);",
    );
    const rows = database.exec({
      sql: "SELECT id, score FROM records WHERE folder = 'ready' ORDER BY score DESC",
      rowMode: "object",
      returnValue: "resultRows",
    });
    assert.deepEqual(rows.map((row) => ({ ...row })), [
      { id: 2, score: 91 },
      { id: 1, score: 72 },
    ]);
  } finally {
    database.close();
  }
});
