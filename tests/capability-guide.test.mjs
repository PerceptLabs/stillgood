import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCapabilityGuide,
  friendlyEverydayLevel,
  friendlyMultitaskingLevel,
  friendlyOfficeLevel,
  friendlyVideoLevel,
  runQualityLabel,
} from "../lib/capability-guide.mjs";

const chromebookResult = {
  grade: "C+",
  formFactor: "computer",
  browsing: { score: 74, highestComfortable: "Busy", highestUsable: "Demanding" },
  email: { score: 76, highestComfortable: "20,000 messages", highestUsable: "50,000 messages" },
  writing: { score: 82, highestComfortable: "25,000 words", highestUsable: "60,000 words" },
  spreadsheets: { score: 70, highestComfortable: "50,000 cells", highestUsable: "150,000 cells" },
  multitasking: { score: 67, highestComfortable: "Busy", highestUsable: "Demanding" },
  graphics: { score: 48 },
  video: {
    available: true,
    highestComfortable: "1080p",
    highestUsable: "1080p",
  },
  roles: ["Email and webmail", "Writing and documents", "Spreadsheets", "Remote access"],
};

test("technical tiers receive friendly, consistent names", () => {
  assert.equal(friendlyEverydayLevel("Basic"), "Light browsing");
  assert.equal(friendlyMultitaskingLevel("Busy"), "Several everyday tasks");
  assert.equal(friendlyVideoLevel(chromebookResult.video), "1080p video");
  assert.equal(
    friendlyOfficeLevel(chromebookResult.email, "email"),
    "Busy inboxes",
  );
});

test("a light-use result becomes a concrete practical guide", () => {
  const guide = buildCapabilityGuide(chromebookResult);
  assert.equal(guide.headline, "Good for lighter work");
  assert.match(guide.summary, /office and browser work/);
  assert.equal(guide.browsingLabel, "Busy websites");
  assert.equal(guide.officeLabel, "Everyday office work");
  assert.match(
    guide.bestFor.find((item) => item.title === "Email and webmail").detail,
    /busy inboxes/,
  );
  assert.doesNotMatch(JSON.stringify(guide), /20,000|25,000|50,000/);
  assert.ok(
    guide.bestFor.some((item) => item.title === "Writing and documents"),
  );
  assert.ok(guide.cautions.some((item) => item.title === "Too many active tasks"));
  assert.equal(
    guide.setup,
    "One main task plus a few light background tasks",
  );
});

test("large save stalls become prominent practical advice", () => {
  const guide = buildCapabilityGuide({
    ...chromebookResult,
    responsiveness: { label: "Occasional pauses" },
    memory: { available: true, score: 92 },
    storage: {
      available: true,
      score: 88,
      largeFlushMs: 678,
    },
  });

  assert.equal(guide.largeSaveLabel, "Noticeable pause");
  assert.ok(
    guide.cautions.some(
      (item) => item.title === "Large saves can cause a clear pause",
    ),
  );
  assert.ok(
    guide.cautions.some((item) => item.title === "Occasional catch-up"),
  );
});

test("the performance profile explains similar totals with stable meaningful differences", () => {
  const hpResult = {
    ...chromebookResult,
    grade: "B+",
    score: 86,
    confidence: "High",
    variability: 0.08,
    browsing: { score: 86 },
    email: { score: 92 },
    writing: { score: 77 },
    spreadsheets: { score: 91 },
    multitasking: { score: 92 },
    graphics: { score: 89 },
    video: { score: 100, available: true, highestComfortable: "4K" },
  };
  const hpGuide = buildCapabilityGuide(hpResult);
  assert.equal(
    hpGuide.performanceProfile.summary,
    "Video playback and email were especially strong. Large documents may slow first.",
  );
  assert.ok(
    hpGuide.performanceProfile.limits.some(
      (item) => item.title === "Writing and documents" && item.relative,
    ),
  );
  assert.deepEqual(
    hpGuide.performanceProfile.limits.map((item) => item.title),
    ["Writing and documents"],
  );
  assert.equal(hpGuide.variation.margin, 2);
  assert.equal(hpGuide.capabilityCards[0].rating, "Comfortable");
  assert.equal(hpGuide.capabilityCards[1].rating, "Practical");
  assert.equal(hpGuide.capabilityCards[2].rating, "Comfortable · 4K");

  const hpOnePointHigher = buildCapabilityGuide({
    ...hpResult,
    score: 87,
    browsing: { score: 87 },
    writing: { score: 79 },
  });
  assert.deepEqual(
    hpOnePointHigher.performanceProfile.limits.map((item) => item.title),
    hpGuide.performanceProfile.limits.map((item) => item.title),
  );
  assert.equal(hpOnePointHigher.headline, hpGuide.headline);
  assert.equal(hpOnePointHigher.topSummary, hpGuide.topSummary);

  const phoneGuide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "B+",
    browsing: { score: 86 },
    email: { score: 93 },
    writing: { score: 81 },
    spreadsheets: { score: 92 },
    multitasking: { score: 98 },
    graphics: { score: 98 },
    video: { score: 100, available: true, highestComfortable: "4K" },
  });
  assert.deepEqual(
    phoneGuide.performanceProfile.strengths.map((item) => item.title),
    ["Video playback", "Multitasking", "Visual smoothness"],
  );
});

test("a uniformly strong system is described as well rounded", () => {
  const guide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "A",
    browsing: { score: 93 },
    email: { score: 97 },
    writing: { score: 90 },
    spreadsheets: { score: 98 },
    multitasking: { score: 100 },
    graphics: { score: 100 },
    video: { score: 100, available: true, highestComfortable: "4K" },
  });
  assert.equal(guide.performanceProfile.wellRounded, true);
  assert.equal(guide.performanceProfile.limits.length, 0);
  assert.equal(
    guide.performanceProfile.summary,
    "Everyday performance was consistently strong, with no clear weak area.",
  );
});

test("A-minus computer wording stays grounded in second-life capability", () => {
  const guide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "A-",
    score: 92,
  });
  assert.equal(guide.headline, "Fast for everyday work");
});

test("heavy-work reserve is reported separately from everyday performance", () => {
  const dellGuide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "A",
    score: 96,
    confidence: "High",
    responsiveness: { label: "Steady" },
    upperReserve: { tested: true, score: 98 },
    shadowScoring: {
      pressureIndex: 5883,
      extendedPressureIndex: 4697,
    },
  });
  assert.equal(dellGuide.reserve.label, "Exceptional");
  assert.match(dellGuide.topSummary, /exceptionally responsive/);

  const amdGuide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "A-",
    score: 94,
    confidence: "High",
    responsiveness: { label: "Steady" },
    upperReserve: { tested: true, score: 89 },
    shadowScoring: {
      pressureIndex: 3576,
      extendedPressureIndex: 2773,
    },
  });
  assert.equal(amdGuide.reserve.label, "Strong");

  const hpGuide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "A-",
    score: 91,
    confidence: "High",
    responsiveness: { label: "Steady" },
    upperReserve: { tested: false, score: null },
    shadowScoring: {
      pressureIndex: null,
      extendedPressureIndex: null,
    },
  });
  assert.equal(hpGuide.reserve.label, "Not checked");
  assert.match(hpGuide.topSummary, /did not verify/);
});

test("inconsistent response is stated before unverified reserve", () => {
  const guide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "B",
    score: 82,
    confidence: "Medium",
    responsiveness: { label: "Noticeable hitches" },
    upperReserve: { tested: false, score: null },
  });
  assert.equal(guide.consistency.label, "Noticeable hitches");
  assert.match(guide.topSummary, /some take much longer/);
  assert.doesNotMatch(guide.topSummary, /reserve/);
  assert.equal(guide.runQuality.label, "Usable");
});

test("run quality translates technical confidence into user language", () => {
  assert.equal(runQualityLabel("High"), "Clean");
  assert.equal(runQualityLabel("Medium"), "Usable");
  assert.equal(runQualityLabel("Low"), "Use with caution");
});
