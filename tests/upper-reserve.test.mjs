import assert from "node:assert/strict";
import test from "node:test";
import {
  planUpperReserve,
  shouldRunExtendedReserve,
} from "../lib/upper-reserve.mjs";

function strongSummary(overrides = {}) {
  return {
    score: 97,
    confidence: "High",
    headroom: { score: 91 },
    browsing: { score: 93 },
    email: { score: 95 },
    writing: { score: 95 },
    spreadsheets: { score: 97 },
    multitasking: { score: 99 },
    memory: { available: true, topGradeEligible: true },
    storage: { available: true, score: 100 },
    ...overrides,
  };
}

test("near-ceiling devices qualify for the upper reserve stage", () => {
  const plan = planUpperReserve(strongSummary());
  assert.equal(plan.needed, true);
  assert.equal(plan.reason, "upper-range-qualified");
  assert.deepEqual(plan.categories, [
    "browsing",
    "email",
    "writing",
    "spreadsheets",
    "multitasking",
  ]);
});

test("headroom no longer acts as an upper-reserve participation cliff", () => {
  const plan = planUpperReserve(strongSummary({ headroom: { score: 82 } }));
  assert.equal(plan.needed, true);
  assert.equal(plan.minimumHeadroom, null);
  assert.equal(plan.observedHeadroom, 82);
});

test("ordinary second-life results finish without the upper reserve stage", () => {
  const plan = planUpperReserve(strongSummary({ score: 88 }));
  assert.equal(plan.needed, false);
  assert.equal(plan.reason, "ordinary-range-is-enough");
});

test("reserve eligibility uses the hidden score instead of rounded display points", () => {
  const qualifies = planUpperReserve(
    strongSummary({ score: 88, internalScoring: { final: 890 } }),
  );
  const misses = planUpperReserve(
    strongSummary({ score: 89, internalScoring: { final: 884 } }),
  );

  assert.equal(qualifies.needed, true);
  assert.equal(qualifies.candidateScore1000, 890);
  assert.equal(misses.needed, false);
});

test("one weak core area blocks a misleading top-end extension", () => {
  const plan = planUpperReserve(
    strongSummary({ writing: { score: 81 } }),
  );
  assert.equal(plan.needed, false);
  assert.equal(plan.reason, "core-work-below-gate");
});

test("noisy runs are not made longer", () => {
  const plan = planUpperReserve(strongSummary({ confidence: "Medium" }));
  assert.equal(plan.needed, false);
  assert.equal(plan.reason, "confidence-not-high");
});

test("only an exceptionally responsive standard reserve escalates", () => {
  assert.equal(
    shouldRunExtendedReserve({
      loadedP95Ms: 42,
      loadedWorstMs: 92,
      slowdownRatio: 1.28,
      onTimeRatio: 0.98,
    }),
    true,
  );
  assert.equal(
    shouldRunExtendedReserve({
      loadedP95Ms: 82,
      loadedWorstMs: 170,
      slowdownRatio: 1.6,
      onTimeRatio: 0.92,
    }),
    false,
  );
  assert.equal(
    shouldRunExtendedReserve({
      loadedP95Ms: 42,
      loadedWorstMs: 92,
      slowdownRatio: 1.28,
      onTimeRatio: 0.98,
      advancedAvailable: true,
      advancedLoadedP95Ms: 720,
      advancedSlowdownRatio: 1.42,
    }),
    true,
  );
  assert.equal(
    shouldRunExtendedReserve({
      loadedP95Ms: 42,
      loadedWorstMs: 92,
      slowdownRatio: 1.28,
      onTimeRatio: 0.98,
      advancedAvailable: true,
      advancedLoadedP95Ms: 1400,
      advancedSlowdownRatio: 2.3,
    }),
    false,
  );
});
