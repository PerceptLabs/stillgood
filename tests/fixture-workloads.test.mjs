import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDocumentDataset,
  buildInboxDataset,
  createDocumentView,
  createInboxView,
  documentActionNames,
  inboxActionNames,
} from "../lib/fixture-workloads.mjs";

test("inbox fixture performs five distinct, valid user journeys", () => {
  const messages = buildInboxDataset(42, 2000);
  const views = inboxActionNames.map((_, index) =>
    createInboxView(messages, index, 120, 900 + index),
  );
  assert.ok(views.every((view) => view.success));
  assert.equal(views[1].activeMessage != null, true);
  assert.ok(views[2].rows.some((row) => row.selected));
  assert.ok(views[3].draft.length > 40);
  assert.equal(views[4].folder, "archive");
  assert.equal(new Set(views.map((view) => view.checksum)).size, views.length);
});

test("document fixture exercises find, edit, format, sort, and persistence", () => {
  const documentModel = buildDocumentDataset(84, 12000);
  const views = documentActionNames.map((_, index) =>
    createDocumentView(documentModel, index, 180, 1200 + index),
  );
  assert.ok(views.every((view) => view.success));
  assert.ok(views[0].matchCount > 0);
  assert.ok(views[1].paragraphs.some((paragraph) => paragraph.text.includes("owner approved")));
  assert.ok(views[2].paragraphs.some((paragraph) => paragraph.bold));
  assert.ok(views[3].tableRows[0].year >= views[3].tableRows.at(-1).year);
  assert.equal(views[4].saved, true);
});

test("fixture generation is deterministic for repeatable comparisons", () => {
  const first = buildInboxDataset(123, 100);
  const second = buildInboxDataset(123, 100);
  assert.deepEqual(first, second);
  assert.equal(
    createInboxView(first, 0, 40, 5).checksum,
    createInboxView(second, 0, 40, 5).checksum,
  );
});
