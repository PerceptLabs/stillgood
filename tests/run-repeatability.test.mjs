import assert from "node:assert/strict";
import test from "node:test";
import { summarizeRecentRunRange } from "../lib/run-repeatability.mjs";

const current = {
  score: 78,
  profileVersion: "6.19.0-paired-reserve-repeatability",
  browser: "Chromium 150",
  platform: "Linux x86_64",
  logicalProcessors: 8,
};

test("recent comparable runs expose variable performance without changing a score", () => {
  const range = summarizeRecentRunRange(current, [
    { ...current, score: 66 },
    { ...current, score: 75 },
  ]);
  assert.equal(range.variable, true);
  assert.equal(range.minimumScore, 66);
  assert.equal(range.maximumScore, 78);
  assert.equal(current.score, 78);
});

test("different profiles and devices are not treated as comparable", () => {
  const range = summarizeRecentRunRange(current, [
    { ...current, score: 66, profileVersion: "6.18.0-adaptive-mixed-reserve" },
    { ...current, score: 65, logicalProcessors: 4 },
  ]);
  assert.equal(range.available, false);
  assert.equal(range.comparableRuns, 1);
});
