import assert from "node:assert/strict";
import test from "node:test";
import {
  browsingActionNames,
  buildBrowsingDataset,
  createBrowsingView,
} from "../lib/browsing-workloads.mjs";
import {
  buildEmailDataset,
  buildSpreadsheetDataset,
  buildWritingDataset,
  createEmailView,
  createSpreadsheetView,
  createWritingView,
  emailActionNames,
  spreadsheetActionNames,
  writingActionNames,
} from "../lib/office-workloads.mjs";

test("browsing fixture covers articles, search, shopping, and busy pages", () => {
  const dataset = buildBrowsingDataset(31, 6500);
  const views = browsingActionNames.map((_, index) =>
    createBrowsingView(dataset, index, 64, 500 + index),
  );
  assert.ok(views.every((view) => view.success));
  assert.equal(views[0].layout, "article");
  assert.ok(views[0].paragraphs.length >= 8);
  assert.equal(views[1].query, "repair guide");
  assert.equal(views[2].layout, "catalog");
  assert.equal(views[3].layout, "homepage");
  assert.equal(views[4].query, "Highly rated");
  assert.ok(views.every((view) => view.items.length <= 64));
});

test("email fixture covers large-mailbox and rich-message journeys", () => {
  const messages = buildEmailDataset(42, 20000);
  const views = emailActionNames.map((_, index) =>
    createEmailView(messages, index, 64, 900 + index),
  );
  assert.ok(views.every((view) => view.success));
  assert.ok(views[1].thread.length > 1);
  assert.ok(views[2].rows.some((row) => row.selected));
  assert.equal(views[3].draftBlocks.length, 3);
  assert.equal(views[4].folder, "archive");
  assert.equal(views[5].activeMessage.kind, "newsletter");
  assert.ok(views.every((view) => view.rows.length <= 100));
});

test("writing fixture exercises long-document layout and reflow", () => {
  const documentModel = buildWritingDataset(84, 25000);
  const views = writingActionNames.map((_, index) =>
    createWritingView(documentModel, index, 300, 1200 + index),
  );
  assert.ok(views.every((view) => view.success));
  assert.ok(views[1].matchCount > 0);
  assert.ok(views[2].paragraphs.some((paragraph) => paragraph.text.includes("changes the wrapping")));
  assert.equal(views[3].editorWidth, 520);
  assert.ok(views[4].paragraphs.some((paragraph) => paragraph.bold || paragraph.italic));
  assert.ok(views[5].tableRows.length > 0);
  assert.equal(views[6].saved, true);
  assert.equal(views[0].wordCount, 25000);
});

test("spreadsheet fixture recalculates, sorts, filters, pastes, searches, and scrolls", () => {
  const workbook = buildSpreadsheetDataset(91, 50000);
  const views = spreadsheetActionNames.map((_, index) =>
    createSpreadsheetView(workbook, index, 36, 1400 + index),
  );
  assert.ok(views.every((view) => view.success));
  assert.ok(views[1].recalculatedCells >= workbook.rowCount * 4);
  assert.notEqual(views[2].rows[0].row, 1);
  assert.ok(views[3].visibleMatches < workbook.rowCount);
  assert.equal(views[4].pasteCount, 1000);
  assert.equal(views[5].query, "Chromebook");
  assert.ok(views[6].startRow > 0);
});

test("office fixture generation is deterministic", () => {
  const first = buildEmailDataset(123, 100);
  const second = buildEmailDataset(123, 100);
  assert.deepEqual(first, second);
  assert.equal(
    createEmailView(first, 0, 40, 5).checksum,
    createEmailView(second, 0, 40, 5).checksum,
  );
  const firstSheet = buildSpreadsheetDataset(7, 1000);
  const secondSheet = buildSpreadsheetDataset(7, 1000);
  assert.equal(
    createSpreadsheetView(firstSheet, 1, 20, 8).checksum,
    createSpreadsheetView(secondSheet, 1, 20, 8).checksum,
  );
});
