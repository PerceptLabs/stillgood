import assert from "node:assert/strict";
import test from "node:test";

import {
  consolidateVideoTierAttempts,
  isComfortableVideoTier,
  needsVideoConfirmation,
  shouldAttempt4k,
  shouldAttemptExtendedVideo,
} from "../lib/video-headroom.mjs";

const comfortableVideo = (id = "1080p") => ({
  id,
  valid: true,
  completed: true,
  droppedRatio: 0.002,
  stalls: 0,
  stallDurationMs: 0,
  longestStallMs: 0,
});

const reserveGroup = () => [
  { id: "everyday", earlyStopped: false },
  { id: "headroom", earlyStopped: false },
];

const healthyGraphics = () => [
  { id: "light", valid: true, onTimeRatio: 0.99 },
  { id: "medium", valid: true, onTimeRatio: 0.95 },
  { id: "busy", valid: true, onTimeRatio: 0.88 },
];

test("extended video requires strong everyday reserve and comfortable 1080p", () => {
  assert.equal(
    shouldAttemptExtendedVideo({
      latencyGroups: [reserveGroup(), reserveGroup(), reserveGroup(), []],
      graphicsTiers: healthyGraphics(),
      baseVideoTier: comfortableVideo(),
    }),
    true,
  );
  assert.equal(
    shouldAttemptExtendedVideo({
      latencyGroups: [reserveGroup(), reserveGroup(), [], []],
      graphicsTiers: healthyGraphics(),
      baseVideoTier: comfortableVideo(),
    }),
    false,
  );
});

test("extended video is skipped when graphics or 1080p is not comfortable", () => {
  assert.equal(
    shouldAttemptExtendedVideo({
      latencyGroups: [reserveGroup(), reserveGroup(), reserveGroup()],
      graphicsTiers: healthyGraphics().map((tier, index) =>
        index === 2 ? { ...tier, onTimeRatio: 0.7 } : tier,
      ),
      baseVideoTier: comfortableVideo(),
    }),
    false,
  );
  assert.equal(
    isComfortableVideoTier({
      ...comfortableVideo(),
      droppedRatio: 0.03,
    }),
    false,
  );
});

test("4K is attempted only after comfortable 1080p60 and 1440p", () => {
  assert.equal(
    shouldAttempt4k([
      comfortableVideo("1080p60"),
      comfortableVideo("1440p"),
    ]),
    true,
  );
  assert.equal(
    shouldAttempt4k([
      comfortableVideo("1080p60"),
      { ...comfortableVideo("1440p"), droppedRatio: 0.04 },
    ]),
    false,
  );
});

test("a lower tier is confirmed when a higher resolution is comfortable", () => {
  assert.equal(
    needsVideoConfirmation(
      [
        { ...comfortableVideo("720p"), droppedRatio: 0.03 },
        comfortableVideo("1080p"),
      ],
      0,
    ),
    true,
  );
  assert.equal(
    needsVideoConfirmation(
      [comfortableVideo("720p"), comfortableVideo("1080p")],
      0,
    ),
    false,
  );
});

test("three-attempt confirmation removes a single playback outlier", () => {
  const first = {
    ...comfortableVideo("720p"),
    label: "720p",
    droppedRatio: 0.03,
    totalFrames: 136,
    measurementSource: "playback-quality",
    mediaAdvancedMs: 4500,
  };
  const confirmed = consolidateVideoTierAttempts([
    first,
    { ...first, droppedRatio: 0, stalls: 0 },
    { ...first, droppedRatio: 0, stalls: 0 },
  ]);
  assert.equal(confirmed.droppedRatio, 0);
  assert.equal(confirmed.confirmationRuns, 2);
  assert.equal(confirmed.initialDroppedRatio, 0.03);
  assert.deepEqual(confirmed.attemptDroppedRatios, [0.03, 0, 0]);
  assert.equal(isComfortableVideoTier(confirmed), true);
});
