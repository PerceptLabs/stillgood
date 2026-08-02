import assert from "node:assert/strict";
import test from "node:test";
import { planBoundaryConfirmation } from "../lib/boundary-confirmation.mjs";

function result(score, overrides = {}) {
  return {
    score,
    confidence: "High",
    browsing: { score: 87, medianCv: 0.08 },
    email: { score: 93, medianCv: 0.06 },
    writing: { score: 79, medianCv: 0.1 },
    spreadsheets: { score: 91, medianCv: 0.05 },
    multitasking: { score: 92, medianCv: 0.08 },
    ...overrides,
  };
}

test("a clean result within one point of a grade boundary is confirmed", () => {
  const plan = planBoundaryConfirmation(result(87));
  assert.equal(plan.needed, true);
  assert.equal(plan.gradeBoundary, 86);
  assert.deepEqual(plan.categories.slice(0, 2), ["writing", "browsing"]);
});

test("a result away from grade and capability boundaries finishes normally", () => {
  const plan = planBoundaryConfirmation(
    result(84, {
      browsing: { score: 88, medianCv: 0.08 },
      email: { score: 91, medianCv: 0.06 },
      writing: { score: 81, medianCv: 0.1 },
      spreadsheets: { score: 91, medianCv: 0.05 },
      multitasking: { score: 91, medianCv: 0.08 },
    }),
  );
  assert.equal(plan.needed, false);
});

test("a capability boundary can trigger confirmation without a grade boundary", () => {
  const plan = planBoundaryConfirmation(
    result(84, {
      browsing: { score: 86, medianCv: 0.08 },
      email: { score: 91, medianCv: 0.06 },
      writing: { score: 81, medianCv: 0.1 },
      spreadsheets: { score: 91, medianCv: 0.05 },
      multitasking: { score: 91, medianCv: 0.08 },
    }),
  );
  assert.equal(plan.reason, "capability-boundary");
  assert.deepEqual(plan.categories, ["browsing"]);
});

test("low-confidence runs are not prolonged by boundary confirmation", () => {
  const plan = planBoundaryConfirmation(result(86, { confidence: "Low" }));
  assert.equal(plan.needed, false);
  assert.equal(plan.reason, "low-confidence");
});
