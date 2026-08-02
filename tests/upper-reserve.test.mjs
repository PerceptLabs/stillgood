import assert from "node:assert/strict";
import test from "node:test";
import { planUpperReserve } from "../lib/upper-reserve.mjs";

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

test("ordinary second-life results finish without the upper reserve stage", () => {
  const plan = planUpperReserve(strongSummary({ score: 87 }));
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
