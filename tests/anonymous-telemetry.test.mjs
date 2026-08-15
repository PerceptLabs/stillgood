import assert from "node:assert/strict";
import test from "node:test";
import {
  browserContext,
  buildAnonymousTelemetry,
} from "../lib/anonymous-telemetry.mjs";

test("browser context keeps only broad, useful device information", () => {
  assert.deepEqual(
    browserContext(
      "Mozilla/5.0 (X11; CrOS aarch64 15917.0.0) AppleWebKit/537.36 Chrome/150.0.7339.0 Safari/537.36 private-token",
      16.67,
      4,
    ),
    {
      browserFamily: "Chromium",
      browserMajor: "150",
      platformFamily: "ChromeOS",
      logicalProcessorsBucket: "4-5",
      displayCadenceBucket: "53-76hz",
    },
  );
});

test("anonymous telemetry excludes exact identity and full browser strings", () => {
  const telemetry = buildAnonymousTelemetry(
    {
      schemaVersion: "stillgood-result.v6.20",
      result: {
        profileVersion: "6.20.0-advanced-web-work",
        browser: "Chrome 150 with a private marker",
        platform: "Private workstation name",
        startedAt: "2026-08-01T12:34:56.000Z",
        score: 82,
        grade: "B",
        confidence: "High",
        cadenceMs: 16.67,
        logicalProcessors: 8,
        formFactor: "computer",
        responsiveness: { score: 80, p95Ms: 320 },
        headroom: { score: 65, openCeilings: 1 },
        upperReserve: {
          tested: true,
          score: 84,
          gradeCeiling: 96,
          components: [
            { id: "multitasking", score: 79, weight: 0.25 },
            { id: "private-component", score: 100, private: true },
          ],
        },
        memory: { score: 92, reportedMemoryGB: 8 },
        boundaryConfirmation: {
          triggered: true,
          reason: "grade-boundary",
          margin: 1,
          gradeBoundary: 82,
          plannedCategories: ["writing", "browsing", "email"],
          runs: [
            { category: "writing", tier: "extreme", addedSamples: 2 },
          ],
          scoreBefore: 81,
          gradeBefore: "B",
          scoreAfter: 82,
          gradeAfter: "B+",
          privateNote: "must-not-survive",
        },
        browsing: {
          score: 79,
          tiers: [{ id: "everyday", medianMs: 220, worstMs: 410 }],
        },
        raw: {
          mixedReserve: {
            tested: true,
            durationMs: 12040,
            baselineP95Ms: 62,
            loadedP95Ms: 118,
            loadedWorstMs: 290,
            slowdownRatio: 1.9,
            actionCount: 84,
            hitch250Ratio: 0.02,
            hitch500Ratio: 0,
            onTimeRatio: 0.94,
            longFrameRatio: 0.03,
            worstFrameMs: 48,
            videoDroppedRatio: 0.004,
            imageEditP95Ms: 82,
            pdfP95Ms: 96,
            advancedAvailable: true,
            advancedBaselineP95Ms: 240,
            advancedLoadedP95Ms: 360,
            advancedWorstMs: 410,
            advancedSlowdownRatio: 1.5,
            advancedBaselineStartupMs: 510,
            advancedStartupMs: 720,
            advancedCombinedMedianMs: 310,
            advancedSqliteP95Ms: 130,
            advancedParserP95Ms: 95,
            advancedJsonP95Ms: 120,
            advancedIterations: 12,
            memoryPressureMB: 512,
      storagePressureMB: 64,
      paired: false,
      levels: [],
            privateDeviceName: "must-not-survive",
          },
          browsingTiers: [
            {
              id: "everyday",
              label: "Typical browsing",
              setupMs: 4200,
              samples: [
                {
                  durationMs: 220,
                  actions: [
                    {
                      name: "open article",
                      durationMs: 31,
                      workMs: 14,
                      presentationMs: 17,
                    },
                  ],
                },
              ],
            },
          ],
          memoryTiers: [
            {
              id: "memory-1024",
              targetMB: 1024,
              retainedMB: 1024,
              allocator: "webassembly",
              gcWorstRoundMs: 28,
              gcObjectsCreated: 360000,
            },
          ],
        },
      },
    },
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0 private-token",
  );

  const serialized = JSON.stringify(telemetry);
  assert.equal(telemetry.context.browserFamily, "Chromium");
  assert.equal(telemetry.context.browserMajor, "150");
  assert.equal(telemetry.context.platformFamily, "Windows");
  assert.equal(telemetry.context.reportedMemoryClass, "8+");
  assert.equal(telemetry.outcome.score, 82);
  assert.equal(telemetry.evidence.memoryTiers[0].allocator, "webassembly");
  assert.equal(telemetry.evidence.browsingTiers[0].setupMs, 4200);
  assert.deepEqual(telemetry.outcome.upperReserve, {
    tested: true,
    score: 84,
    gradeCeiling: 96,
    components: [{ id: "multitasking", score: 79 }],
  });
  assert.deepEqual(telemetry.outcome.boundaryConfirmation, {
    triggered: true,
    reason: "grade-boundary",
    margin: 1,
    gradeBoundary: 82,
    plannedCategories: ["writing", "browsing", "email"],
    runs: [{ category: "writing", tier: "extreme", addedSamples: 2 }],
    scoreBefore: 81,
    gradeBefore: "B",
    scoreAfter: 82,
    gradeAfter: "B+",
  });
  assert.deepEqual(telemetry.outcome.mixedReserve, {
    tested: true,
    durationMs: 12040,
    baselineP95Ms: 62,
    loadedP95Ms: 118,
    loadedWorstMs: 290,
    slowdownRatio: 1.9,
    actionCount: 84,
    hitch250Ratio: 0.02,
    hitch500Ratio: 0,
    onTimeRatio: 0.94,
    longFrameRatio: 0.03,
    worstFrameMs: 48,
    videoDroppedRatio: 0.004,
    imageEditP95Ms: 82,
    pdfP95Ms: 96,
    advancedAvailable: true,
    advancedBaselineP95Ms: 240,
    advancedLoadedP95Ms: 360,
    advancedWorstMs: 410,
    advancedSlowdownRatio: 1.5,
    advancedBaselineStartupMs: 510,
    advancedStartupMs: 720,
    advancedCombinedMedianMs: 310,
    advancedSqliteP95Ms: 130,
    advancedParserP95Ms: 95,
    advancedJsonP95Ms: 120,
    advancedIterations: 12,
    memoryPressureMB: 512,
    storagePressureMB: 64,
    paired: false,
    levels: [],
  });
  assert.doesNotMatch(serialized, /private-token|Private workstation|2026-08-01/);
  assert.doesNotMatch(serialized, /must-not-survive/);
  assert.doesNotMatch(serialized, /userAgent|startedAt|browser\":\"Chrome/);
});
