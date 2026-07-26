import assert from "node:assert/strict";
import test from "node:test";
import {
  coefficientOfVariation,
  gradeForScore,
  median,
  normalizeLower,
  percentile,
  summarizeLatencyTiers,
  summarizeThoroughRun,
} from "../lib/scoring.mjs";

test("statistics preserve median, tail, and variation", () => {
  const samples = [20, 22, 23, 24, 25, 26, 27, 28, 90, 220];
  assert.equal(median(samples), 25.5);
  assert.equal(percentile(samples, 0.75), 28);
  assert.equal(percentile(samples, 0.95), 220);
  assert.ok(coefficientOfVariation(samples) > 0.9);
});

test("normalization interpolates and clamps", () => {
  const points = [
    { value: 100, score: 100 },
    { value: 300, score: 50 },
    { value: 1000, score: 0 },
  ];
  assert.equal(normalizeLower(50, points), 100);
  assert.equal(normalizeLower(1000, points), 0);
  assert.equal(normalizeLower(200, points), 75);
});

test("grade bands provide useful extra strata", () => {
  assert.equal(gradeForScore(94).grade, "A+");
  assert.equal(gradeForScore(86).grade, "A");
  assert.equal(gradeForScore(78).grade, "B+");
  assert.equal(gradeForScore(70).grade, "B");
  assert.equal(gradeForScore(60).grade, "C+");
  assert.equal(gradeForScore(50).grade, "C");
  assert.equal(gradeForScore(40).grade, "D");
  assert.equal(gradeForScore(20).grade, "E");
});

test("tier scoring preserves latency strata and workload capacity", () => {
  const result = summarizeLatencyTiers([
    { id: "basic", label: "Basic", samples: [80, 82, 84] },
    { id: "everyday", label: "Everyday", samples: [130, 140, 145] },
    { id: "busy", label: "Busy", samples: [180, 190, 210] },
    { id: "demanding", label: "Demanding", samples: [320, 350, 390] },
    { id: "extreme", label: "Extreme", samples: [800, 900, 1100] },
  ]);
  assert.equal(result.highestComfortable, "Busy");
  assert.equal(result.highestUsable, "Demanding");
  assert.ok(result.score >= 60 && result.score < 85);
});

test("continuous latency scoring separates devices inside the same status band", () => {
  const faster = summarizeLatencyTiers([
    { id: "basic", label: "Basic", samples: [110, 115, 120, 118, 112] },
  ]);
  const slower = summarizeLatencyTiers([
    { id: "basic", label: "Basic", samples: [180, 185, 190, 188, 182] },
  ]);
  assert.equal(faster.tiers[0].status, "comfortable");
  assert.equal(slower.tiers[0].status, "comfortable");
  assert.ok(faster.score > slower.score);
});

test("early-stopped tiers are explicit and never masquerade as measured", () => {
  const result = summarizeLatencyTiers([
    { id: "basic", label: "Basic", samples: [800, 900, 1000] },
    {
      id: "busy",
      label: "Busy",
      earlyStopped: true,
      samples: [{ durationMs: 6000 }],
    },
  ]);
  assert.equal(result.tiers[1].status, "stopped");
  assert.equal(result.tiers[1].earlyStopped, true);
  assert.equal(result.tiers[1].score, 0);
});

function latencyTiers(values) {
  return ["Basic", "Everyday", "Busy", "Demanding", "Extreme"]
    .slice(0, values.length)
    .map(
    (label, index) => ({
      id: label.toLowerCase(),
      label,
      samples: values[index].map((durationMs) => ({ durationMs })),
    }),
    );
}

function fullMetrics(coreValues) {
  return {
    emailTiers: latencyTiers(coreValues),
    writingTiers: latencyTiers(coreValues),
    spreadsheetTiers: latencyTiers(coreValues),
    multitaskTiers: latencyTiers(coreValues.slice(1)),
    graphicsTiers: [
      { id: "1", label: "Light", onTimeRatio: 1, longFrameRatio: 0, frameCount: 100 },
      { id: "2", label: "Medium", onTimeRatio: 0.99, longFrameRatio: 0, frameCount: 100 },
      { id: "3", label: "Busy", onTimeRatio: 0.97, longFrameRatio: 0.01, frameCount: 100 },
      { id: "4", label: "Dense", onTimeRatio: 0.9, longFrameRatio: 0.05, frameCount: 100 },
    ],
    videoTiers: [
      { id: "480p", label: "480p", completed: true, droppedRatio: 0, stalls: 0, totalFrames: 96 },
      { id: "720p", label: "720p", completed: true, droppedRatio: 0, stalls: 0, totalFrames: 126 },
      {
        id: "1080p",
        label: "1080p",
        completed: true,
        droppedRatio: 0.03,
        stalls: 1,
        totalFrames: 126,
      },
    ],
    storageTiers: [
      { id: "1", label: "1 MB", writeMs: 40, readMs: 10 },
      { id: "8", label: "8 MB", writeMs: 180, readMs: 40 },
      { id: "32", label: "32 MB", writeMs: 700, readMs: 120 },
    ],
    recoveryMs: 500,
    longTaskCount: 8,
    longAnimationFrameCount: 4,
    interruptionCount: 0,
  };
}

test("a strong second-life profile is separated from modern-fast hardware", () => {
  const result = summarizeThoroughRun(
    fullMetrics([
      [70, 75, 80],
      [110, 120, 125],
      [180, 195, 210],
      [330, 360, 390],
      [850, 930, 1050],
    ]),
  );
  assert.ok(["B+", "B"].includes(result.grade));
  assert.equal(result.ceilingReached, false);
});

test("easy categories cannot hide a weak core workload", () => {
  const metrics = fullMetrics([
    [400, 450, 500],
    [700, 800, 900],
    [1300, 1500, 1700],
    [2500, 2700, 2900],
    [5000, 5200, 5400],
  ]);
  const result = summarizeThoroughRun(metrics);
  assert.ok(result.score <= 47);
  assert.ok(["D", "E", "C"].includes(result.grade));
});

test("only broadly fast and stable hardware reaches the ceiling", () => {
  const result = summarizeThoroughRun(
    fullMetrics([
      [40, 41, 42],
      [45, 46, 47],
      [50, 51, 52],
      [55, 56, 57],
      [60, 61, 62],
    ]),
  );
  assert.equal(result.ceilingReached, false);
  assert.ok(result.score >= 84);
});

test("a zero-frame video tier is invalid and cannot earn a recommendation", () => {
  const metrics = fullMetrics([
    [40, 41, 42],
    [45, 46, 47],
    [50, 51, 52],
    [55, 56, 57],
    [60, 61, 62],
  ]);
  metrics.videoTiers[2] = {
    id: "1080p",
    label: "1080p",
    completed: true,
    droppedRatio: 0,
    stalls: 0,
    totalFrames: 0,
  };
  const result = summarizeThoroughRun(metrics);
  assert.equal(result.video.tiers[2].status, "invalid");
  assert.equal(result.video.highestUsable, "720p");
  assert.ok(!result.roles.includes("Video up to 1080p"));
  assert.equal(result.confidence, "Medium");
  assert.ok(result.score <= 91);
  assert.ok(result.integrityNotes.some((note) => note.includes("valid frame count")));
});

test("an unavailable video module lowers confidence without erasing core results", () => {
  const metrics = fullMetrics([
    [80, 82, 84],
    [120, 125, 130],
    [170, 180, 190],
    [300, 320, 340],
    [700, 760, 820],
  ]);
  metrics.videoTiers = metrics.videoTiers.map((tier) => ({
    ...tier,
    totalFrames: 0,
  }));
  const result = summarizeThoroughRun(metrics);
  assert.equal(result.video.available, false);
  assert.equal(result.confidence, "Low");
  assert.ok(result.score >= 68);
  assert.ok(!result.roles.some((role) => role.includes("video up to")));
});

test("intentional long tasks do not lower otherwise sound measurement confidence", () => {
  const metrics = fullMetrics([
    [80, 82, 84],
    [120, 125, 130],
    [170, 180, 190],
    [300, 320, 340],
    [700, 760, 820],
  ]);
  metrics.longTaskCount = 150;
  const result = summarizeThoroughRun(metrics);
  assert.equal(result.confidence, "High");
});
