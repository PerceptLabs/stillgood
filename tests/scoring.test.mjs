import assert from "node:assert/strict";
import test from "node:test";
import {
  coefficientOfVariation,
  calibrateTopEndScore1000,
  continuousHeadroomCeiling,
  gradeForScore,
  median,
  normalizeLower,
  percentile,
  qualifiesForHeadroom,
  reserveOpportunityAward,
  summarizeGraphicsFrames,
  summarizeHeadroom,
  summarizeLatencyTiers,
  summarizeMemory,
  summarizeResponsivenessConsistency,
  summarizeStorage,
  summarizeThoroughRun,
  summarizeUpperReserve,
  summarizeVideo,
} from "../lib/scoring.mjs";

test("top-end calibration preserves ordinary scores and reserves exceptional headroom", () => {
  assert.equal(calibrateTopEndScore1000(680), 680);
  assert.equal(calibrateTopEndScore1000(900), 900);
  assert.equal(calibrateTopEndScore1000(940), 930);
  assert.equal(calibrateTopEndScore1000(950), 938);
  assert.equal(calibrateTopEndScore1000(980), 960);
  assert.equal(calibrateTopEndScore1000(990), 980);
  assert.equal(calibrateTopEndScore1000(1000), 1000);
});

test("an upper reserve tier is isolated from ordinary category and headroom scoring", () => {
  const withoutReserve = summarizeLatencyTiers([
    { id: "everyday", label: "Everyday", samples: [90, 95, 100] },
    { id: "limit", label: "Maximum", samples: [180, 190, 200] },
  ]);
  const withReserve = summarizeLatencyTiers([
    { id: "everyday", label: "Everyday", samples: [90, 95, 100] },
    { id: "limit", label: "Maximum", samples: [180, 190, 200] },
    { id: "reserve", label: "Upper reserve", samples: [620, 680, 740] },
  ]);

  assert.equal(withReserve.everydayScore, withoutReserve.everydayScore);
  assert.equal(withReserve.score, withoutReserve.score);
  assert.equal(withReserve.testedHeadroom, true);
  assert.equal(withReserve.limitFound, withoutReserve.limitFound);
  assert.ok(withReserve.tiers.at(-1).score < withReserve.score);
});

test("headroom ceilings remain continuous instead of collapsing at 87", () => {
  assert.equal(continuousHeadroomCeiling(82), 94);
  assert.equal(continuousHeadroomCeiling(84), 96);
  assert.equal(continuousHeadroomCeiling(87), 99);
  assert.equal(continuousHeadroomCeiling(88), 100);
  assert.equal(continuousHeadroomCeiling(55), 67);
});

test("upper reserve evidence creates additional top-end score strata", () => {
  const category = (score) => ({
    tiers: [{ id: "reserve", score }],
  });
  const strong = summarizeUpperReserve({
    browsing: category(89),
    email: category(91),
    writing: category(86),
    spreadsheets: category(94),
    multitasking: category(84),
    graphics: category(90),
    memory: { tiers: [{ targetMB: 2048, score: 88 }] },
    storage: {
      tiers: [{ source: "persistent-file", sizeMB: 256, score: 90 }],
    },
    recoveryScore: 92,
  });
  const exceptional = summarizeUpperReserve({
    browsing: category(98),
    email: category(98),
    writing: category(96),
    spreadsheets: category(99),
    multitasking: category(97),
    graphics: category(96),
    memory: { tiers: [{ targetMB: 2048, score: 97 }] },
    storage: {
      tiers: [{ source: "persistent-file", sizeMB: 256, score: 98 }],
    },
    recoveryScore: 98,
  });

  assert.equal(strong.tested, true);
  assert.ok(strong.gradeCeiling < exceptional.gradeCeiling);
  assert.equal(exceptional.gradeCeiling, 100);
  assert.ok(exceptional.score > strong.score);
});

test("a mixed reserve stage rewards quick overlapping work and penalizes catch-up delay", () => {
  const strong = summarizeUpperReserve({
    mixedReserve: {
      tested: true,
      loadedP95Ms: 82,
      loadedWorstMs: 190,
      slowdownRatio: 1.35,
      onTimeRatio: 0.96,
    },
  });
  const constrained = summarizeUpperReserve({
    mixedReserve: {
      tested: true,
      loadedP95Ms: 460,
      loadedWorstMs: 1450,
      slowdownRatio: 4.2,
      onTimeRatio: 0.7,
    },
  });

  assert.equal(strong.tested, true);
  assert.ok(strong.score >= 80);
  assert.ok(strong.score > constrained.score + 20);
  assert.ok(strong.gradeCeiling > constrained.gradeCeiling);
  assert.deepEqual(
    strong.components.map((component) => component.id),
    ["mixed-response", "slowdown", "tail", "frame-delivery"],
  );
});

test("paired reserve scoring preserves top-end latency strata", () => {
  const reserve = (loadedP95Ms) => summarizeUpperReserve({
    mixedReserve: {
      tested: true,
      paired: true,
      levels: [{
        id: "standard",
        loadedP95Ms,
        loadedWorstMs: 48,
        slowdownRatio: 1.2,
        onTimeRatio: 0.98,
      }],
    },
  });
  const sixteen = reserve(16);
  const twentySeven = reserve(27);
  assert.ok(sixteen.score >= twentySeven.score + 3);
  assert.ok(
    sixteen.components.find((component) => component.id === "mixed-response").score >
      twentySeven.components.find((component) => component.id === "mixed-response").score,
  );
});

test("advanced web work adds top-end reserve detail without replacing foreground evidence", () => {
  const reserve = (advancedLoadedP95Ms, advancedSlowdownRatio) =>
    summarizeUpperReserve({
      mixedReserve: {
        tested: true,
        paired: true,
        levels: [{
          id: "standard",
          loadedP95Ms: 28,
          loadedWorstMs: 92,
          slowdownRatio: 1.25,
          onTimeRatio: 0.97,
          advancedAvailable: true,
          advancedLoadedP95Ms,
          advancedSlowdownRatio,
          advancedStartupMs: 700,
        }],
      },
    });
  const roomy = reserve(280, 1.18);
  const constrained = reserve(2100, 3.2);

  assert.ok(roomy.score > constrained.score + 6);
  assert.equal(
    roomy.components.find((component) => component.id === "advanced-web-work")?.weight,
    0.18,
  );
  assert.equal(
    roomy.components.find((component) => component.id === "mixed-response")?.score,
    constrained.components.find((component) => component.id === "mixed-response")?.score,
  );
});

test("upper reserve awards points continuously without penalizing an attempt", () => {
  const constrained = reserveOpportunityAward({
    tested: true,
    score1000: 690,
    levels: [{ id: "standard", score1000: 690 }],
  }, 900);
  const strong = reserveOpportunityAward({
    tested: true,
    score1000: 900,
    levels: [{ id: "standard", score1000: 900 }],
  }, 900);
  const exceptional = reserveOpportunityAward({
    tested: true,
    score1000: 990,
    levels: [
      { id: "standard", score1000: 990 },
      { id: "extended", score1000: 990 },
    ],
  }, 900);

  assert.equal(constrained.totalBonus1000, 0);
  assert.ok(strong.standardBonus1000 > 0);
  assert.equal(strong.extendedBonus1000, 0);
  assert.ok(exceptional.totalBonus1000 > strong.totalBonus1000);
  assert.ok(exceptional.totalBonus1000 <= 50);
  assert.ok(exceptional.fillFraction <= 0.5);
  assert.equal(exceptional.remaining1000, 100);
});

test("remaining-distance reserve preserves meaningful everyday separation", () => {
  const reserveEvidence = {
    tested: true,
    score1000: 994,
    levels: [{ id: "standard", score1000: 994 }],
  };
  const lowerBase = reserveOpportunityAward(reserveEvidence, 929);
  const higherBase = reserveOpportunityAward(reserveEvidence, 968);
  const lowerFinal = 929 + lowerBase.totalBonus1000;
  const higherFinal = 968 + higherBase.totalBonus1000;

  assert.ok(higherFinal > lowerFinal);
  assert.ok(higherFinal - lowerFinal >= 20);
  assert.ok(lowerFinal < 1000);
  assert.ok(higherFinal < 1000);
});

test("upper reserve does not feed back into ordinary scores or confidence", () => {
  const baseMetrics = fullMetrics([
    [45, 48, 50],
    [50, 54, 58],
    [65, 70, 74],
    [82, 88, 94],
    [145, 155, 165],
  ]);
  const base = summarizeThoroughRun(baseMetrics);
  const extendedMetrics = structuredClone(baseMetrics);
  for (const key of [
    "browsingTiers",
    "emailTiers",
    "writingTiers",
    "spreadsheetTiers",
    "multitaskTiers",
  ]) {
    extendedMetrics[key].push({
      id: "reserve",
      label: "Upper reserve",
      setupMs: 4200,
      samples: [950, 1050, 1150].map((durationMs) => ({ durationMs })),
    });
  }
  extendedMetrics.graphicsTiers.push({
    id: "reserve",
    label: "Sustained",
    valid: false,
    frameCount: 0,
    onTimeRatio: 0,
    longFrameRatio: 1,
    worstFrameMs: 999,
  });
  const extended = summarizeThoroughRun(extendedMetrics);

  assert.equal(extended.browsing.score, base.browsing.score);
  assert.equal(extended.writing.score, base.writing.score);
  assert.equal(extended.multitasking.score, base.multitasking.score);
  assert.equal(extended.graphics.score, base.graphics.score);
  assert.equal(extended.headroom.score, base.headroom.score);
  assert.equal(extended.responsiveness.score, base.responsiveness.score);
  assert.equal(extended.confidence, base.confidence);
  assert.equal(extended.upperReserve.tested, true);
});

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

function stableMemoryTiers(levels) {
  return levels.map((targetMB) => ({
    id: `memory-${targetMB}`,
    label: `${targetMB} MB active`,
    targetMB,
    retainedMB: targetMB,
    addedMB: targetMB,
    allocator: "webassembly",
    allocationMs: 180,
    scanMs: 1100,
    scannedMB: targetMB * 4,
    sweepMBps: 7000,
    copyRoundTripMs: 1320,
    probeP95Ms: 4,
    probeWorstMs: 20,
    gcChurnMs: 45,
    gcWorstRoundMs: 11,
    gcObjectsCreated: 360000,
  }));
}

test("coarse memory hints and measured reserve jointly control top-grade eligibility", () => {
  const fourClass = summarizeMemory(
    stableMemoryTiers([128, 256, 512, 768]),
    true,
    4,
  );
  const eightClassAtOneGigabyte = summarizeMemory(
    stableMemoryTiers([128, 256, 512, 1024]),
    true,
    8,
  );
  const highReserve = summarizeMemory(
    stableMemoryTiers([128, 256, 512, 1024, 1280, 1536]),
    true,
    8,
  );

  assert.equal(fourClass.reportedMemoryLabel, "4 GB class");
  assert.equal(fourClass.gradeCeiling, 81);
  assert.equal(eightClassAtOneGigabyte.gradeCeiling, 93);
  assert.equal(eightClassAtOneGigabyte.topGradeEligible, false);
  assert.equal(highReserve.reserveLabel, "High browser reserve");
  assert.equal(highReserve.topGradeEligible, true);
  assert.equal(highReserve.gradeCeiling, 100);
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

test("a cold persistent-file stall is retained without replacing steady scoring", () => {
  const bulk = [{ id: "1", label: "1 MB", writeMs: 20, readMs: 5 }];
  const strict = [{
    id: "strict-8",
    label: "8 small saves",
    p95CommitMs: 8,
    worstCommitMs: 14,
    verified: true,
  }];
  const persistent = {
    id: "opfs-16",
    label: "16 MB persistent file",
    sizeMB: 16,
    randomReads: 128,
    writeMs: 140,
    flushMs: 110,
    flushP95Ms: 110,
    flushWorstMs: 125,
    coldFlushMs: 1400,
    randomReadMs: 18,
    verified: true,
    available: true,
  };
  const cold = summarizeStorage(bulk, strict, [persistent]);
  const steadyOnly = summarizeStorage(bulk, strict, [
    { ...persistent, coldFlushMs: null },
  ]);
  assert.equal(cold.score, steadyOnly.score);
  assert.equal(cold.coldLargeFlushMs, 1400);
  assert.equal(cold.largeFlushMs, 110);
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

test("the internal 1000-point scale preserves differences hidden by public rounding", () => {
  const first = summarizeLatencyTiers([
    { id: "everyday", label: "Everyday", samples: [80, 81, 82] },
  ]);
  const second = summarizeLatencyTiers([
    { id: "everyday", label: "Everyday", samples: [80.5, 81.5, 82.5] },
  ]);

  assert.equal(first.score, second.score);
  assert.notEqual(first.score1000, second.score1000);
  assert.ok(first.score1000 > second.score1000);
});

test("the final public score is derived from the hidden evidence matrix", () => {
  const result = summarizeThoroughRun(fullMetrics([
    [45, 48, 50],
    [50, 54, 58],
    [65, 70, 74],
    [82, 88, 94],
    [145, 155, 165],
  ]));

  assert.equal(result.internalScoring.scale, 1000);
  assert.equal(
    result.internalScoring.aggregation,
    "normalized-weighted-geometric-with-calibrated-top-range-v3",
  );
  assert.equal(result.internalScoring.publicScore, result.score);
  assert.ok(Math.abs(result.internalScoring.final / 10 - result.score) <= 0.5);
  assert.equal(
    result.internalScoring.matrix.browsing.combined,
    result.browsing.score1000,
  );
  assert.equal(
    result.internalScoring.matrix.storage.combined,
    result.storage.score1000,
  );
});

test("sub-100 ms ordinary work retains useful workstation headroom strata", () => {
  const workstation = summarizeLatencyTiers([
    { id: "basic", label: "Basic", samples: [34, 37, 40, 36, 38] },
  ]);
  const mobile = summarizeLatencyTiers([
    { id: "basic", label: "Basic", samples: [78, 84, 90, 86, 82] },
  ]);

  assert.equal(workstation.tiers[0].status, "comfortable");
  assert.equal(mobile.tiers[0].status, "comfortable");
  assert.ok(workstation.score >= mobile.score + 4);
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
  assert.ok(result.score <= result.headroom.score + 12);
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

  assert.ok(result.email.everydayScore >= 96);
  assert.ok(result.email.capacityScore < result.email.everydayScore);
  assert.ok(result.email.score > result.email.capacityScore);
  assert.ok(result.score > 83);
  assert.ok(result.score <= result.headroom.score + 12);
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

test("a 4 GB memory class is capped at a useful second-life grade", () => {
  const metrics = fullMetrics([
    [35, 36, 37],
    [38, 39, 40],
    [42, 43, 44],
    [46, 47, 48],
    [50, 51, 52],
  ]);
  metrics.reportedMemoryGB = 4;
  metrics.memoryTiers = stableMemoryTiers([128, 256, 512, 768]);
  const result = summarizeThoroughRun(metrics);

  assert.ok(result.score <= 81);
  assert.equal(result.memory.gradeCeiling, 81);
  assert.notEqual(result.grade, "A+");
});

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

test("a completed run without reserve evidence keeps its uncapped established result", () => {
  const metrics = fullMetrics([
    [34, 36, 38],
    [38, 40, 42],
    [42, 44, 46],
    [46, 48, 50],
    [50, 52, 54],
  ]);
  metrics.reserveEvaluationComplete = true;
  const result = summarizeThoroughRun(metrics);

  assert.equal(result.upperReserve.tested, false);
  assert.ok(result.score >= 90);
  assert.equal(result.internalScoring.reserveAward.totalBonus1000, 0);
  assert.equal(
    result.internalScoring.baseAfterReserveCap,
    result.internalScoring.baseBeforeReserve,
  );
  assert.equal(
    result.internalScoring.baseForReserve,
    result.internalScoring.baseBeforeReserve,
  );
});

test("poor reserve performance cannot lower the everyday base score", () => {
  const metrics = fullMetrics([
    [34, 36, 38],
    [38, 40, 42],
    [42, 44, 46],
    [46, 48, 50],
    [50, 52, 54],
  ]);
  const withoutReserve = summarizeThoroughRun(metrics);
  const withReserveMetrics = structuredClone(metrics);
  withReserveMetrics.mixedReserve = {
    tested: true,
    levels: [{
      id: "standard",
      loadedP95Ms: 1800,
      loadedWorstMs: 4200,
      slowdownRatio: 7,
      onTimeRatio: 0.35,
    }],
  };
  const withReserve = summarizeThoroughRun(withReserveMetrics);

  assert.equal(withReserve.score, withoutReserve.score);
  assert.equal(withReserve.internalScoring.reserveAward.totalBonus1000, 0);
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

test("Firefox preserves weak browser-visible graphics without a score adjustment", () => {
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
  metrics.browserFamily = "firefox";
  const result = summarizeThoroughRun(metrics);

  assert.ok(result.graphics.everydayScore < 58);
  assert.ok(result.score <= 67);
  assert.equal(result.evidenceGroups.postScoreNormalizationApplied, false);
  assert.equal(result.browserSupport.level, "experimental");
  assert.ok(
    result.integrityNotes.some((note) =>
      note.includes("no browser-specific score multiplier"),
    ),
  );
});

test("browser identity alone cannot change a raw score", () => {
  const metrics = fullMetrics([
    [45, 48, 50],
    [50, 54, 58],
    [65, 70, 74],
    [82, 88, 94],
    [145, 155, 165],
  ]);
  const unchangedReference = summarizeThoroughRun(metrics);
  metrics.browserFamily = "chromium";
  const chromiumResult = summarizeThoroughRun(metrics);
  metrics.browserFamily = "firefox";
  const firefoxResult = summarizeThoroughRun(metrics);

  assert.equal(chromiumResult.score, unchangedReference.score);
  assert.equal(chromiumResult.grade, unchangedReference.grade);
  assert.equal(firefoxResult.score, chromiumResult.score);
  assert.equal(firefoxResult.grade, chromiumResult.grade);
  assert.equal(firefoxResult.graphics.score, chromiumResult.graphics.score);
  assert.equal(firefoxResult.headroom.score, chromiumResult.headroom.score);
  assert.equal(
    firefoxResult.evidenceGroups.webExperience.score,
    chromiumResult.evidenceGroups.webExperience.score,
  );
  assert.equal(
    firefoxResult.evidenceGroups.resourceResilience.score,
    chromiumResult.evidenceGroups.resourceResilience.score,
  );
  assert.equal(chromiumResult.browserSupport.level, "reference");
  assert.equal(firefoxResult.browserSupport.level, "experimental");
});

test("evidence groups separate web behavior from equal-work resource evidence", () => {
  const metrics = fullMetrics([
    [55, 58, 62],
    [70, 75, 80],
    [95, 105, 115],
    [130, 145, 160],
    [410, 440, 470],
  ]);
  metrics.browserFamily = "firefox";
  const result = summarizeThoroughRun(metrics);

  assert.equal(result.evidenceGroups.profileVersion, "browser-evidence-v1.0");
  assert.equal(
    result.evidenceGroups.webExperience.preserveBrowserDifferences,
    true,
  );
  assert.equal(
    result.evidenceGroups.resourceResilience.preserveBrowserDifferences,
    false,
  );
  assert.equal(
    result.evidenceGroups.resourceResilience.treatment,
    "equal-work-adapters-only",
  );
  assert.ok(
    result.evidenceGroups.webExperience.categories.includes("graphics"),
  );
  assert.ok(
    result.evidenceGroups.resourceResilience.categories.includes("storage"),
  );
  assert.ok(result.evidenceGroups.webExperience.score >= 0);
  assert.ok(result.evidenceGroups.webExperience.score <= 100);
  assert.ok(result.evidenceGroups.resourceResilience.score >= 0);
  assert.ok(result.evidenceGroups.resourceResilience.score <= 100);
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

test("extended media headroom does not change the everyday video score", () => {
  const everyday = ["480p", "720p", "1080p"].map((label) => ({
    id: label,
    label,
    completed: true,
    droppedRatio: 0,
    stalls: 0,
    totalFrames: 120,
    valid: true,
  }));
  const baseline = summarizeVideo(everyday);
  const extended = summarizeVideo([
    ...everyday,
    ...[
      ["1080p60", "1080p60"],
      ["1440p", "1440p"],
      ["4k", "4K"],
    ].map(([id, label]) => ({
      id,
      label,
      headroom: true,
      completed: true,
      droppedRatio: 0,
      stalls: 0,
      totalFrames: 240,
      valid: true,
    })),
  ]);
  assert.equal(extended.score, baseline.score);
  assert.equal(extended.highestComfortable, "4K");
  assert.equal(extended.testedHeadroom, true);
  assert.equal(extended.headroomCeiling, true);
});

test("skipped extended media tiers do not count as invalid measurements", () => {
  const summary = summarizeVideo([
    ...["480p", "720p", "1080p"].map((label) => ({
      id: label,
      label,
      completed: true,
      droppedRatio: 0,
      stalls: 0,
      totalFrames: 120,
      valid: true,
    })),
    {
      id: "4k",
      label: "4K",
      headroom: true,
      skipped: true,
      valid: false,
      completed: false,
      droppedRatio: 0,
      stalls: 0,
      totalFrames: 0,
    },
  ]);
  assert.equal(summary.score, 100);
  assert.equal(summary.invalidTierCount, 0);
  assert.equal(summary.tiers.at(-1).status, "skipped");
  assert.equal(summary.highestComfortable, "1080p");
});
