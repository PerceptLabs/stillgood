import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCapabilityGuide,
  friendlyEverydayLevel,
  friendlyMultitaskingLevel,
  friendlyOfficeLevel,
  friendlyVideoLevel,
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
  assert.equal(friendlyEverydayLevel("Basic"), "Light everyday use");
  assert.equal(friendlyMultitaskingLevel("Busy"), "A few light tasks");
  assert.equal(friendlyVideoLevel(chromebookResult.video), "1080p video");
  assert.equal(
    friendlyOfficeLevel(chromebookResult.email, "email"),
    "Busy inboxes",
  );
});

test("a light-use result becomes a concrete practical guide", () => {
  const guide = buildCapabilityGuide(chromebookResult);
  assert.equal(guide.headline, "A capable light-duty computer");
  assert.match(guide.summary, /office and browser work/);
  assert.equal(guide.browsingLabel, "Busy everyday use");
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
    guide.cautions.some((item) => item.title === "Occasional catch-up pauses"),
  );
});

test("the performance profile explains similar totals with different strengths", () => {
  const hpGuide = buildCapabilityGuide({
    ...chromebookResult,
    grade: "B+",
    browsing: { score: 86 },
    email: { score: 92 },
    writing: { score: 77 },
    spreadsheets: { score: 91 },
    multitasking: { score: 92 },
    graphics: { score: 89 },
    video: { score: 100, available: true, highestComfortable: "4K" },
  });
  assert.match(hpGuide.performanceProfile.summary, /strongest for video playback/);
  assert.match(hpGuide.performanceProfile.summary, /large documents/);
  assert.ok(
    hpGuide.performanceProfile.limits.some(
      (item) => item.title === "Writing and documents" && item.relative,
    ),
  );
  assert.match(
    hpGuide.performanceProfile.limits.find(
      (item) => item.title === "Web browsing",
    ).detail,
    /Ordinary browsing is comfortable/,
  );

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
    ["Video playback", "Using several things", "Scrolling and visual pages"],
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
  assert.match(guide.performanceProfile.summary, /well balanced/);
});
