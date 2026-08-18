import assert from "node:assert/strict";
import test from "node:test";
import { preflightOptionalReserveComponents } from "../lib/reserve-component-preflight.mjs";

test("optional reserve preflight keeps available components", async () => {
  const calls = [];
  const result = await preflightOptionalReserveComponents({
    image: async () => calls.push("image"),
    pdf: async () => calls.push("pdf"),
  });

  assert.deepEqual(calls, ["image", "pdf"]);
  assert.deepEqual(result, {
    available: { image: true, pdf: true },
    failures: [],
  });
});

test("one optional component cannot invalidate the other", async () => {
  const result = await preflightOptionalReserveComponents({
    image: async () => {
      throw new Error("image path unavailable");
    },
    pdf: async () => undefined,
  });

  assert.deepEqual(result, {
    available: { image: false, pdf: true },
    failures: ["image"],
  });
});

test("an omitted component is unavailable without becoming a failure", async () => {
  const result = await preflightOptionalReserveComponents({
    image: async () => undefined,
    pdf: null,
  });

  assert.deepEqual(result, {
    available: { image: true, pdf: false },
    failures: [],
  });
});
