import assert from "node:assert/strict";
import test from "node:test";

import {
  isComfortableVideoTier,
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
