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

test("a one-point headroom fluctuation does not skip an otherwise top result", () => {
  const plan = planUpperReserve(strongSummary({ headroom: { score: 83 } }));
  assert.equal(plan.needed, true);
  assert.equal(plan.minimumHeadroom, 83);
});

test("the headroom buffer does not pull ordinary machines into the extension", () => {
  const plan = planUpperReserve(strongSummary({ headroom: { score: 82 } }));
  assert.equal(plan.needed, false);
  assert.equal(plan.reason, "headroom-below-gate");
});

test("ordinary second-life results finish without the upper reserve stage", () => {
  const plan = planUpperReserve(strongSummary({ score: 88 }));
  assert.equal(plan.needed, false);
  assert.equal(plan.reason, "ordinary-range-is-enough");
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
});
