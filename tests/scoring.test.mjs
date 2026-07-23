import assert from "node:assert/strict";
import test from "node:test";
import {
  gradeForScore,
  latencyPoints,
  normalizeLower,
  percentile,
  summarizePrototypeRun,
} from "../lib/scoring.mjs";

test("percentile keeps high-delay samples visible", () => {
  const samples = [20, 22, 23, 24, 25, 26, 27, 28, 90, 220];
  assert.equal(percentile(samples, 0.75), 28);
  assert.equal(percentile(samples, 0.95), 220);
});

test("latency normalization interpolates and clamps", () => {
  assert.equal(normalizeLower(50, latencyPoints), 100);
  assert.equal(normalizeLower(2000, latencyPoints), 0);
  assert.equal(normalizeLower(275, latencyPoints), 75);
});

test("grade boundaries match the experimental profile", () => {
  assert.deepEqual(gradeForScore(85), { grade: "A", label: "Comfortable" });
  assert.deepEqual(gradeForScore(70), { grade: "B", label: "Useful" });
  assert.deepEqual(gradeForScore(50), { grade: "C", label: "Light-duty" });
  assert.deepEqual(gradeForScore(30), { grade: "D", label: "Single-purpose" });
  assert.deepEqual(gradeForScore(29.99), { grade: "E", label: "Struggling" });
});

test("capability summary reports practical workload limits", () => {
  const result = summarizePrototypeRun({
    actionDurations: [80, 85, 90, 92, 95, 100, 110, 115],
    pressureDurations: [160, 170, 180, 190, 195, 200],
    frameIntervals: Array.from({ length: 120 }, () => 16.67),
    cadenceMs: 16.67,
    recoveryMs: 500,
    longTaskCount: 0,
    longTaskTotalMs: 0,
  });

  assert.equal(result.comfortableWorkload, "Moderate web multitasking");
  assert.equal(result.usableWorkload, "Moderate web multitasking");
  assert.ok(result.roles.includes("Web & email ready"));
  assert.ok(result.score >= 70);
});
