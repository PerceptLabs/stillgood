import assert from "node:assert/strict";
import test from "node:test";
import {
  gradeForScore,
  latencyPoints,
  normalizeLower,
  percentile,
  summarizeFastRun,
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
  const result = summarizeFastRun({
    actionDurations: [80, 85, 90, 92, 95, 100, 110, 115],
    pressureDurations: [160, 170, 180, 190, 195, 200],
    workDurations: [20, 22, 24, 25, 28, 30],
    frameIntervals: Array.from({ length: 120 }, () => 16.67),
    cadenceMs: 16.67,
    recoveryMs: 500,
    videoDroppedRatio: 0.004,
    videoStalls: 0,
    storageWriteMs: 180,
    storageReadMs: 30,
    longTaskCount: 0,
    highestTierCompleted: "moderate",
  });

  assert.equal(result.comfortableWorkload, "Everyday work and light multitasking");
  assert.equal(result.usableWorkload, "Moderate browser multitasking");
  assert.ok(result.roles.includes("Web and email"));
  assert.ok(result.score >= 70);
});

test("fast hardware is described as above the test ceiling", () => {
  const result = summarizeFastRun({
    actionDurations: [35, 38, 40, 42],
    pressureDurations: [55, 60, 64, 68],
    workDurations: [8, 9, 10, 11],
    frameIntervals: Array.from({ length: 120 }, () => 16.67),
    cadenceMs: 16.67,
    recoveryMs: 250,
    videoDroppedRatio: 0,
    videoStalls: 0,
    storageWriteMs: 70,
    storageReadMs: 12,
    longTaskCount: 0,
    highestTierCompleted: "heavy",
  });

  assert.equal(result.ceilingReached, true);
  assert.ok(result.score <= 97);
});
