import assert from "node:assert/strict";
import test from "node:test";
import {
  coefficientOfVariation,
  classifyIsolatedBrowserGraphics,
  classifyTelemetryLimitedOpenCeiling,
  gradeForScore,
  median,
  normalizeLower,
  percentile,
  qualifiesForHeadroom,
  summarizeGraphicsFrames,
  summarizeHeadroom,
  summarizeLatencyTiers,
  summarizeMemory,
  summarizeResponsivenessConsistency,
  summarizeStorage,
  summarizeThoroughRun,
  summarizeVideo,
} from "../lib/scoring.mjs";

test("graphics evaluation uses the same 60 fps target on high-refresh displays", () => {
  const sixtyHertz = summarizeGraphicsFrames({
    drawCount: 108,
    intervals: Array.from({ length: 107 }, () => 16.67),
    displayCadenceMs: 16.67,
    elapsedMs: 1800,
  });
  const highRefresh = summarizeGraphicsFrames({
    drawCount: 108,
    intervals: Array.from({ length: 107 }, (_, index) =>
      index % 2 ? 13.9 : 20.8,
    ),
    displayCadenceMs: 6.94,
    elapsedMs: 1800,
  });

  assert.ok(Math.abs(highRefresh.evaluationCadenceMs - 1000 / 60) < 0.01);
  assert.equal(sixtyHertz.onTimeRatio, 1);
  assert.equal(highRefresh.onTimeRatio, 1);
  assert.equal(highRefresh.longFrameRatio, 0);
});

test("graphics delivery still detects missed 60 fps work", () => {
  const slowed = summarizeGraphicsFrames({
    drawCount: 76,
    intervals: Array.from({ length: 75 }, () => 33.3),
    displayCadenceMs: 6.94,
    elapsedMs: 1800,
  });
  assert.ok(slowed.onTimeRatio > 0.69 && slowed.onTimeRatio < 0.72);
  assert.equal(slowed.expectedFrameCount, 108);
});

test("adaptive headroom runs only after fast, stable measurements", () => {
  assert.equal(
    qualifiesForHeadroom([
      { durationMs: 180 },
      { durationMs: 205 },
      { durationMs: 220 },
    ]),
    true,
  );
  assert.equal(
    qualifiesForHeadroom([
      { durationMs: 150 },
      { durationMs: 170 },
      { durationMs: 1400 },
    ]),
    false,
  );
  assert.equal(
    qualifiesForHeadroom([{ durationMs: 120 }, { durationMs: 130 }]),
    false,
  );
});

test("second adaptive gate allows measured headroom without risking a runaway", () => {
  assert.equal(qualifiesForHeadroom([620, 690, 760], 1), true);
  assert.equal(qualifiesForHeadroom([700, 900, 2200], 1), false);
});

test("brief media waiting events do not masquerade as playback stalls", () => {
  const noWait = summarizeVideo([
    {
      id: "1080p",
      label: "1080p",
      completed: true,
      droppedRatio: 0,
      stalls: 0,
      stallDurationMs: 0,
      longestStallMs: 0,
      totalFrames: 135,
    },
  ]);
  const briefWait = summarizeVideo([
    {
      id: "1080p",
      label: "1080p",
      completed: true,
      droppedRatio: 0,
      stalls: 1,
      stallDurationMs: 24,
      longestStallMs: 24,
      totalFrames: 135,
    },
  ]);
  const visibleWait = summarizeVideo([
    {
      id: "1080p",
      label: "1080p",
      completed: true,
      droppedRatio: 0,
      stalls: 1,
      stallDurationMs: 720,
      longestStallMs: 720,
      totalFrames: 135,
    },
  ]);

  assert.equal(noWait.score, 100);
  assert.equal(noWait.score, briefWait.score);
  assert.equal(briefWait.score, 100);
  assert.equal(briefWait.highestComfortable, "1080p");
  assert.equal(visibleWait.tiers[0].status, "limited");
});

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

test("memory pressure scoring exposes catch-up hitches instead of a RAM claim", () => {
  const steady = summarizeMemory([
    {
      id: "memory-256",
      label: "256 MB active",
      probeP95Ms: 8,
      probeWorstMs: 35,
      copyRoundTripMs: 150,
    },
  ]);
  const hitchy = summarizeMemory([
    {
      id: "memory-256",
      label: "256 MB active",
      probeP95Ms: 180,
      probeWorstMs: 900,
      copyRoundTripMs: 1300,
    },
  ]);

  assert.equal(steady.available, true);
  assert.equal(steady.tiers[0].status, "comfortable");
  assert.ok(hitchy.score < 48);
  assert.ok(steady.score > hitchy.score);
});

test("persistent storage scoring distinguishes quick and delayed durable saves", () => {
  const bulk = [
    { id: "1", label: "1 MB", writeMs: 40, readMs: 10 },
    { id: "8", label: "8 MB", writeMs: 180, readMs: 40 },
    { id: "32", label: "32 MB", writeMs: 700, readMs: 120 },
  ];
  const quick = summarizeStorage(
    bulk,
    [
      {
        id: "strict-24",
        label: "24 small saves",
        p95CommitMs: 8,
        worstCommitMs: 18,
        verified: true,
      },
    ],
    [
      {
        id: "opfs-16",
        label: "16 MB persistent file",
        sizeMB: 16,
        randomReads: 128,
        writeMs: 140,
        flushMs: 18,
        randomReadMs: 24,
        verified: true,
        available: true,
      },
    ],
  );
  const delayed = summarizeStorage(
    bulk,
    [
      {
        id: "strict-24",
        label: "24 small saves",
        p95CommitMs: 420,
        worstCommitMs: 1400,
        verified: true,
      },
    ],
    [
      {
        id: "opfs-16",
        label: "16 MB persistent file",
        sizeMB: 16,
        randomReads: 128,
        writeMs: 4500,
        flushMs: 1800,
        randomReadMs: 5000,
        verified: true,
        available: true,
      },
    ],
  );

  assert.equal(quick.opfsAvailable, true);
  assert.ok(quick.score > delayed.score);
  assert.ok(delayed.score < 58);
});

test("a large flush stall is not hidden by fast small storage operations", () => {
  const bulk = [
    { id: "1", label: "1 MB", writeMs: 5, readMs: 2 },
    { id: "8", label: "8 MB", writeMs: 10, readMs: 4 },
    { id: "32", label: "32 MB", writeMs: 30, readMs: 12 },
  ];
  const strict = [
    {
      id: "strict-64",
      label: "64 small saves",
      p95CommitMs: 8,
      worstCommitMs: 15,
      verified: true,
    },
  ];
  const persistentTier = (flushMs) => ({
    id: "opfs-48",
    label: "48 MB persistent file",
    sizeMB: 48,
    randomReads: 256,
    writeMs: 360,
    flushMs,
    randomReadMs: 6,
    verified: true,
    available: true,
  });
  const hpLike = summarizeStorage(bulk, strict, [persistentTier(119)]);
  const lenovoLike = summarizeStorage(bulk, strict, [persistentTier(678)]);

  assert.ok(hpLike.largeSaveScore - lenovoLike.largeSaveScore >= 25);
  assert.ok(hpLike.score - lenovoLike.score >= 15);
  assert.equal(lenovoLike.largeSaveStatus, "usable");
  assert.equal(lenovoLike.largeFlushMs, 678);
});

test("grade bands provide useful extra strata", () => {
  assert.equal(gradeForScore(98).grade, "A+");
  assert.equal(gradeForScore(97).grade, "A");
  assert.equal(gradeForScore(95).grade, "A");
  assert.equal(gradeForScore(94).grade, "A");
  assert.equal(gradeForScore(93).grade, "A-");
  assert.equal(gradeForScore(90).grade, "A-");
  assert.equal(gradeForScore(89).grade, "B+");
  assert.equal(gradeForScore(86).grade, "B+");
  assert.equal(gradeForScore(85).grade, "B");
  assert.equal(gradeForScore(82).grade, "B");
  assert.equal(gradeForScore(81).grade, "B-");
  assert.equal(gradeForScore(78).grade, "B-");
  assert.equal(gradeForScore(77).grade, "C+");
  assert.equal(gradeForScore(75).grade, "C+");
  assert.equal(gradeForScore(74).grade, "C+");
  assert.equal(gradeForScore(73).grade, "C");
  assert.equal(gradeForScore(68).grade, "C");
  assert.equal(gradeForScore(67).grade, "C-");
  assert.equal(gradeForScore(58).grade, "C-");
  assert.equal(gradeForScore(45).grade, "D");
  assert.equal(gradeForScore(40).grade, "E");
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

test("action-level tails distinguish a consistently fast tier from a hitchy one", () => {
  const sample = (journeyMs, actionDurations) => ({
    durationMs: journeyMs,
    workMs: journeyMs / 2,
    presentationMs: journeyMs / 2,
    actions: actionDurations.map((durationMs, index) => ({
      name: `action-${index}`,
      durationMs,
      workMs: durationMs / 2,
      presentationMs: durationMs / 2,
    })),
  });
  const steady = summarizeLatencyTiers([
    {
      id: "everyday",
      label: "Everyday",
      samples: Array.from({ length: 5 }, () =>
        sample(180, [24, 31, 38, 42, 48]),
      ),
    },
  ]);
  const hitchy = summarizeLatencyTiers([
    {
      id: "everyday",
      label: "Everyday",
      samples: Array.from({ length: 5 }, () =>
        sample(180, [24, 31, 38, 42, 620]),
      ),
    },
  ]);

  assert.equal(steady.tiers[0].status, "comfortable");
  assert.notEqual(hitchy.tiers[0].status, "comfortable");
  assert.ok(steady.score > hitchy.score);
  assert.equal(hitchy.tiers[0].actionP95Ms, 620);
});

test("responsiveness consistency exposes intermittent long-frame congestion", () => {
  const actions = Array.from({ length: 100 }, (_, index) => ({
    name: `action-${index}`,
    durationMs: index < 94 ? 90 : 210,
    workMs: 30,
    presentationMs: index < 94 ? 60 : 180,
  }));
  const summary = summarizeResponsivenessConsistency({
    tierGroups: [[{ id: "everyday", samples: [{ durationMs: 300, actions }] }]],
    longAnimationFrameCount: 540,
    activeMs: 120000,
  });

  assert.equal(summary.label, "Noticeable hitches");
  assert.ok(summary.longFrameRatePerMinute > 250);
  assert.ok(summary.score < 72);
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

test("headroom metadata distinguishes a found limit from an open ceiling", () => {
  const found = summarizeLatencyTiers([
    { id: "extreme", label: "Extreme", samples: [150, 160, 170] },
    { id: "headroom", label: "Extended", samples: [700, 760, 820] },
  ]);
  assert.equal(found.testedHeadroom, true);
  assert.equal(found.limitFound, true);
  assert.equal(found.headroomCeiling, false);

  const open = summarizeLatencyTiers([
    { id: "extreme", label: "Extreme", samples: [100, 110, 120] },
    { id: "headroom", label: "Extended", samples: [130, 140, 150] },
    { id: "limit", label: "Maximum", samples: [160, 170, 180] },
  ]);
  assert.equal(open.testedHeadroom, true);
  assert.equal(open.limitFound, false);
  assert.equal(open.headroomCeiling, true);
});

test("usable maximum tiers preserve measured reserve differences", () => {
  const category = (score) => ({
    score: 95,
    testedHeadroom: true,
    headroomCeiling: true,
    tiers: [
      { id: "headroom", status: "comfortable", score: 95 },
      { id: "limit", status: "usable", score },
    ],
  });
  const workstation = summarizeHeadroom(
    [category(82), category(91), category(86), category(95)],
    { score: 100 },
    { score: 100, everydayScore: 100 },
  );
  const lowPowerLaptop = summarizeHeadroom(
    [category(72), category(83), category(77), category(91)],
    { score: 95 },
    { score: 89, everydayScore: 98 },
  );

  assert.equal(workstation.label, "Very high");
  assert.equal(lowPowerLaptop.label, "High");
  assert.ok(workstation.score > lowPowerLaptop.score);
  assert.ok(lowPowerLaptop.score < 88);
});

test("good everyday speed cannot conceal a lower-power reserve ceiling", () => {
  const metrics = fullMetrics([
    [55, 58, 62],
    [70, 75, 80],
    [95, 105, 115],
    [130, 145, 160],
    [410, 440, 470],
  ]);
  const result = summarizeThoroughRun(metrics);

  assert.ok(result.headroom.score < 88);
  assert.ok(result.score <= result.headroom.score + 7);
  assert.notEqual(result.grade, "A+");
});

test("adaptive reserve tiers do not redefine everyday capability", () => {
  const metrics = fullMetrics([
    [45, 48, 50],
    [50, 54, 58],
    [65, 70, 74],
    [82, 88, 94],
    [145, 155, 165],
  ]);
  metrics.emailTiers.push(
    {
      id: "headroom",
      label: "Extended",
      headroom: true,
      samples: [700, 750, 800].map((durationMs) => ({ durationMs })),
    },
    {
      id: "limit",
      label: "Maximum",
      headroom: true,
      samples: [1400, 1500, 1600].map((durationMs) => ({ durationMs })),
    },
  );
  metrics.videoTiers = metrics.videoTiers.map((tier) => ({
    ...tier,
    droppedRatio: 0,
    stalls: 0,
    stallDurationMs: 0,
    longestStallMs: 0,
  }));

  const result = summarizeThoroughRun(metrics);

  assert.ok(result.email.score < 86);
  assert.ok(result.email.everydayScore >= 96);
  assert.ok(result.score > 83);
  assert.ok(result.score <= result.headroom.score + 7);
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
    browsingTiers: latencyTiers(coreValues),
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
  assert.ok(result.grade.startsWith("B"));
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

test("a dense graphics stress tier reports headroom without capping everyday use", () => {
  const metrics = fullMetrics([
    [105, 110, 115],
    [110, 115, 120],
    [115, 120, 125],
    [125, 130, 140],
    [145, 155, 165],
  ]);
  metrics.graphicsTiers = [
    { id: "1", label: "Light", onTimeRatio: 1, longFrameRatio: 0, frameCount: 100 },
    { id: "2", label: "Medium", onTimeRatio: 1, longFrameRatio: 0, frameCount: 100 },
    { id: "3", label: "Busy", onTimeRatio: 0.99, longFrameRatio: 0.01, frameCount: 100 },
    { id: "4", label: "Dense", onTimeRatio: 0.64, longFrameRatio: 0.25, frameCount: 100 },
  ];
  const result = summarizeThoroughRun(metrics);
  assert.ok(result.graphics.score >= 68);
  assert.ok(result.graphics.everydayScore >= 90);
  assert.ok(result.score >= 84);
});

test("weak everyday graphics still limits an otherwise excellent result", () => {
  const metrics = fullMetrics([
    [105, 110, 115],
    [110, 115, 120],
    [115, 120, 125],
    [125, 130, 140],
    [145, 155, 165],
  ]);
  metrics.graphicsTiers = [
    { id: "1", label: "Light", onTimeRatio: 0.8, longFrameRatio: 0.18, worstFrameMs: 120, frameCount: 80 },
    { id: "2", label: "Medium", onTimeRatio: 0.7, longFrameRatio: 0.24, worstFrameMs: 180, frameCount: 70 },
    { id: "3", label: "Busy", onTimeRatio: 0.55, longFrameRatio: 0.35, worstFrameMs: 260, frameCount: 55 },
    { id: "4", label: "Dense", onTimeRatio: 0.4, longFrameRatio: 0.5, worstFrameMs: 500, frameCount: 40 },
  ];
  const result = summarizeThoroughRun(metrics);
  assert.ok(result.graphics.everydayScore < 58);
  assert.ok(result.score <= 67);
});

test("isolated graphics on a limited-telemetry browser is reported separately", () => {
  const metrics = fullMetrics([
    [105, 110, 115],
    [110, 115, 120],
    [115, 120, 125],
    [125, 130, 140],
    [145, 155, 165],
  ]);
  metrics.graphicsTiers = [
    { id: "1", label: "Light", onTimeRatio: 0.62, longFrameRatio: 0.03, worstFrameMs: 466, frameCount: 68 },
    { id: "2", label: "Medium", onTimeRatio: 0.68, longFrameRatio: 0, worstFrameMs: 50, frameCount: 74 },
    { id: "3", label: "Busy", onTimeRatio: 0.32, longFrameRatio: 0.13, worstFrameMs: 100, frameCount: 35 },
    { id: "4", label: "Dense", onTimeRatio: 0.12, longFrameRatio: 0.46, worstFrameMs: 266, frameCount: 13 },
  ];
  metrics.videoTiers = metrics.videoTiers.map((tier) => ({
    ...tier,
    droppedRatio: 0,
    stalls: 0,
    stallDurationMs: 0,
    longestStallMs: 0,
  }));
  metrics.longTaskSupported = false;
  metrics.longAnimationFrameSupported = false;
  const result = summarizeThoroughRun(metrics);

  assert.equal(result.browserCompatibility.isolatedGraphics, true);
  assert.ok(result.graphics.everydayScore < 58);
  assert.ok(result.score > 67);
  assert.ok(
    result.integrityNotes.some((note) =>
      note.includes("isolated visual-rendering limitation"),
    ),
  );
});

test("the isolated graphics adapter cannot change a full-telemetry browser run", () => {
  const classification = classifyIsolatedBrowserGraphics({
    coreEverydayScores: [98, 98, 95, 92, 81],
    graphics: { available: true, score: 28, everydayScore: 34 },
    video: { available: true, score: 100 },
    longTaskSupported: true,
    longAnimationFrameSupported: true,
  });

  assert.equal(classification.isolatedGraphics, false);
});

test("a telemetry-limited browser with four open reserve ceilings uses a proportional cap", () => {
  const classification = classifyTelemetryLimitedOpenCeiling({
    coreEverydayScores: [100, 100, 100, 100, 99],
    headroom: {
      score: 85,
      extendedCategories: 4,
      openCeilings: 4,
    },
    telemetryLimited: true,
  });

  assert.equal(classification.openCeilingHeadroom, true);
  assert.equal(classification.proportionalHeadroomCap, 92);
});

test("the open-ceiling adapter cannot change a full-telemetry browser run", () => {
  const classification = classifyTelemetryLimitedOpenCeiling({
    coreEverydayScores: [100, 100, 100, 100, 99],
    headroom: {
      score: 85,
      extendedCategories: 4,
      openCeilings: 4,
    },
    telemetryLimited: false,
  });

  assert.equal(classification.openCeilingHeadroom, false);
  assert.equal(classification.proportionalHeadroomCap, null);
});

test("the open-ceiling adapter does not lift a limited older-device profile", () => {
  const classification = classifyTelemetryLimitedOpenCeiling({
    coreEverydayScores: [97, 94, 91, 87, 81],
    headroom: {
      score: 66,
      extendedCategories: 4,
      openCeilings: 1,
    },
    telemetryLimited: true,
  });

  assert.equal(classification.openCeilingHeadroom, false);
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

test("an unsettled preflight lowers confidence without inventing a correction", () => {
  const metrics = fullMetrics([
    [80, 82, 84],
    [120, 125, 130],
    [170, 180, 190],
    [300, 320, 340],
    [700, 760, 820],
  ]);
  metrics.baselineUnsettled = true;
  const result = summarizeThoroughRun(metrics);
  assert.equal(result.confidence, "Low");
  assert.ok(result.integrityNotes.some((note) => note.includes("Background activity")));
});
