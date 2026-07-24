import assert from "node:assert/strict";
import test from "node:test";
import { classifyFormFactor } from "../lib/context.mjs";

test("Android Chrome is labeled as mobile despite its Linux platform", () => {
  assert.equal(
    classifyFormFactor({
      userAgent:
        "Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      mobileHint: true,
    }),
    "mobile",
  );
});

test("desktop Linux remains a computer result", () => {
  assert.equal(
    classifyFormFactor({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/150.0.0.0",
      platform: "Linux x86_64",
      mobileHint: false,
    }),
    "computer",
  );
});
