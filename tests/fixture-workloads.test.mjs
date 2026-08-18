import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
import {
  compatibilityAdapterProfile,
  createTextSortRanker,
  planMemoryPressureLevels,
} from "../lib/benchmark-compatibility.mjs";

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

  const expectedSortedIds = messages
    .filter((message) => message.folder === "inbox")
    .sort(
      (left, right) =>
        left.sender.localeCompare(right.sender) ||
        left.id - right.id,
    )
    .slice(0, 64)
    .map((message) => message.id);
  assert.deepEqual(
    views[2].rows.map((message) => message.id),
    expectedSortedIds,
  );
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

test("text sorting uses one deterministic browser-neutral compatibility adapter", () => {
  const names = [
    "Workshop Desk",
    "alex morgan",
    "Repair Fair",
    "Alex Morgan",
  ];
  const ranker = createTextSortRanker(names);
  assert.deepEqual(ranker.orderedValues, [
    "alex morgan",
    "Alex Morgan",
    "Repair Fair",
    "Workshop Desk",
  ]);
  assert.equal(ranker.rankFor("Repair Fair"), 2);
  assert.equal(
    compatibilityAdapterProfile.textSorting,
    "precomputed-fixed-locale-ranks",
  );
  assert.equal(
    compatibilityAdapterProfile.mediaWaiting,
    "measured-duration",
  );
  assert.equal(
    compatibilityAdapterProfile.scoreNormalization,
    "external-versioned-browser-profile",
  );
});

test("compatibility adapters use capabilities rather than browser identity", async () => {
  const source = await readFile(
    new URL("../lib/benchmark-compatibility.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /userAgent|Firefox|Chrom(?:e|ium)|Safari|Gecko/i);
});

test("memory pressure policy bounds mobile browsers when the memory hint is absent", () => {
  const mobileUnknown = planMemoryPressureLevels({
    reportedMemoryGB: null,
    formFactor: "mobile",
  });
  const computerUnknown = planMemoryPressureLevels({
    reportedMemoryGB: null,
    formFactor: "computer",
  });
  const mobileReported = planMemoryPressureLevels({
    reportedMemoryGB: 8,
    formFactor: "mobile",
  });

  assert.deepEqual(mobileUnknown.levels, [128, 256, 384, 512]);
  assert.equal(mobileUnknown.capacityProbeCapped, true);
  assert.equal(Math.max(...computerUnknown.levels), 1536);
  assert.equal(computerUnknown.capacityProbeCapped, false);
  assert.equal(Math.max(...mobileReported.levels), 1536);
  assert.equal(mobileReported.capacityProbeCapped, false);
});
