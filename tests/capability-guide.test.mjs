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
