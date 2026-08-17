import assert from "node:assert/strict";
import test from "node:test";
import {
  shadowReferenceProfile,
  summarizeShadowV7,
} from "../lib/shadow-scoring-v7.mjs";

const categoryKeys = [
  "browsingTiers",
  "emailTiers",
  "writingTiers",
  "spreadsheetTiers",
  "multitaskTiers",
];

function tier(id, durationMs) {
  return {
    id,
    samples: [durationMs * 0.96, durationMs, durationMs * 1.04].map(
      (sample) => ({ durationMs: sample }),
    ),
  };
}

function metricsAtMultiplier(multiplier) {
  const metrics = {};
  for (const key of categoryKeys) {
    const profile = Object.values(shadowReferenceProfile.categoryProfiles).find(
      (candidate) => candidate.metricsKey === key,
    );
    metrics[key] = ["basic", "everyday", "busy", "demanding", "extreme"].map(
      (id) => tier(id, profile.comfortableMedianMs * multiplier),
    );
  }
  return metrics;
}

test("the shadow index is an unbounded reference ratio rather than another 1000-point ceiling", () => {
  const reference = summarizeShadowV7(metricsAtMultiplier(1));
  const twiceAsFast = summarizeShadowV7(metricsAtMultiplier(0.5));

  assert.equal(reference.status, "shadow");
  assert.equal(reference.publicScoreAffected, false);
  assert.ok(reference.webIndex >= 1000);
  assert.ok(twiceAsFast.webIndex > reference.webIndex * 1.5);
  assert.ok(twiceAsFast.webIndex > 1000);
});

test("adaptive capacity preserves a lower bound when every measured tier remains comfortable", () => {
  const metrics = metricsAtMultiplier(0.4);
  metrics.browsingTiers.push(tier("headroom", 150), tier("limit", 190));
  const result = summarizeShadowV7(metrics);
  const browsing = result.categories.browsing;

  assert.equal(browsing.openCeiling, true);
  assert.equal(browsing.comfortableCapacity, 250000);
  assert.ok(browsing.capacityIndex > 5000);
});

test("capacity is interpolated between the last comfortable and first overloaded tier", () => {
  const metrics = metricsAtMultiplier(0.7);
  metrics.writingTiers = [
    tier("basic", 80),
    tier("everyday", 110),
    tier("busy", 180),
    tier("demanding", 280),
    tier("extreme", 520),
  ];
  const writing = summarizeShadowV7(metrics).categories.writing;

  assert.deepEqual(writing.bracket, ["demanding", "extreme"]);
  assert.ok(writing.comfortableCapacity > 60000);
  assert.ok(writing.comfortableCapacity < 100000);
  assert.equal(writing.openCeiling, false);
});

test("identical standard pressure exposes large performance differences without saturation", () => {
  const base = metricsAtMultiplier(0.7);
  const pressure = (loadedP95Ms, iterations, advancedLoadedP95Ms) => ({
    tested: true,
    levels: [
      {
        id: "standard",
        loadedP95Ms,
        loadedWorstMs: loadedP95Ms * 2,
        slowdownRatio: loadedP95Ms / 42,
        onTimeRatio: loadedP95Ms < 50 ? 1 : 0.9,
        advancedIterations: iterations,
        advancedLoadedP95Ms,
        workerCount: 2,
        memoryPressureMB: 512,
        storagePressureMB: 64,
      },
    ],
  });
  const chromebook = summarizeShadowV7({
    ...base,
    mixedReserve: pressure(118, 29, 445),
  });
  const workstation = summarizeShadowV7({
    ...base,
    mixedReserve: pressure(21, 165, 78),
  });

  assert.ok(chromebook.pressureIndex > 700);
  assert.ok(workstation.pressureIndex > chromebook.pressureIndex * 4);
  assert.equal(workstation.pressure.levels[0].workerCount, 2);
});

test("a missing reserve stage remains explicit instead of inventing comparable evidence", () => {
  const result = summarizeShadowV7(metricsAtMultiplier(1.2));

  assert.equal(result.pressureIndex, null);
  assert.equal(result.coverage, "web-only");
  assert.equal(result.systemIndex, result.webIndex);
});
