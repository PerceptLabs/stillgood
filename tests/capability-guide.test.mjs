import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCapabilityGuide,
  friendlyEverydayLevel,
  friendlyMultitaskingLevel,
  friendlyVideoLevel,
} from "../lib/capability-guide.mjs";

const chromebookResult = {
  grade: "C+",
  formFactor: "computer",
  everyday: { highestComfortable: "Basic", highestUsable: "Demanding" },
  documents: { score: 100 },
  multitasking: { score: 67, highestComfortable: "Busy", highestUsable: "Demanding" },
  graphics: { score: 48 },
  video: {
    available: true,
    highestComfortable: "1080p",
    highestUsable: "1080p",
  },
  roles: ["Web and email", "Documents and PDFs", "Remote access"],
};

test("technical tiers receive friendly, consistent names", () => {
  assert.equal(friendlyEverydayLevel("Basic"), "Everyday basics");
  assert.equal(friendlyMultitaskingLevel("Busy"), "A few light tasks");
  assert.equal(friendlyVideoLevel(chromebookResult.video), "H.264 1080p");
});

test("a light-use result becomes a concrete practical guide", () => {
  const guide = buildCapabilityGuide(chromebookResult);
  assert.equal(guide.headline, "A capable light-duty computer");
  assert.match(guide.summary, /basic spreadsheets/);
  assert.match(
    guide.bestFor.find((item) => item.title === "Web and email").detail,
    /few ordinary tabs/,
  );
  assert.ok(
    guide.bestFor.some((item) => item.title === "Writing and documents"),
  );
  assert.ok(guide.cautions.some((item) => item.title === "Heavy web apps"));
  assert.equal(
    guide.setup,
    "One main task plus a few light background tasks",
  );
});
