import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function requestWorker(path, init, env) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  globalThis.__CLOUDFLARE_TEST_ENV__ = env;
  try {
    return await worker.fetch(new Request(`http://localhost${path}`, init), env, {
      waitUntil() {},
      passThroughOnException() {},
    });
  } finally {
    delete globalThis.__CLOUDFLARE_TEST_ENV__;
  }
}

test("server-renders the StillGood product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>StillGood — What can this computer still do\?(?: · StillGood)?<\/title>/i,
  );
  assert.match(html, /What is this computer still good for/);
  assert.match(html, />Start<\/span>/);
  assert.match(html, />the test<\/small>/);
  assert.match(html, /What does it test/);
  assert.match(html, /Usually two to four minutes/);
  assert.doesNotMatch(html, /Method v3/);
  assert.match(html, /A second-life computer check/);
  assert.match(html, />Browsing</);
  assert.match(html, /Articles, search results, shopping pages, navigation, and filters/);
  assert.match(html, /Email/);
  assert.match(html, /Searching, opening conversations, sorting, and writing replies/);
  assert.match(html, /Editing, page layout, formatting, tables, and reopening documents/);
  assert.match(html, /Formulas, sorting, filtering, pasting, searching, and scrolling/);
  assert.match(html, /Local video at everyday resolutions/);
  assert.match(html, /Keeps larger working sets active and watches for catch-up pauses/);
  assert.match(html, /Commits small changes, flushes local files, reopens them, and verifies the data/);
  assert.match(html, /href="\/methodology"/);
  assert.match(html, /saved on this device/i);
  assert.match(html, /Help improve StillGood/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /href="https:\/\/github\.com\/PerceptLabs\/stillgood"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("server-renders the privacy disclosure", async () => {
  const response = await render("/privacy");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Your results stay on your device by default/);
  assert.match(html, /sharing option is off by default/i);
  assert.match(html, /What we do not collect/);
  assert.match(html, /persistent device identifier/);
  assert.match(html, /does not put that address into its benchmark database/);
  assert.match(html, /href="https:\/\/github\.com\/PerceptLabs\/stillgood"/);
});

test("anonymous telemetry stores only the server allowlist", async () => {
  const captured = { sql: "", values: [] };
  const statement = {
    bind(...values) {
      captured.values = values;
      return this;
    },
    async run() {
      return { success: true, meta: {} };
    },
  };
  const response = await requestWorker(
    "/api/telemetry",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        schemaVersion: "stillgood-telemetry.v1",
        resultSchemaVersion: "stillgood-result.v6.17",
        profileVersion: "6.17.0-upper-reserve",
        context: {
          browserFamily: "Chromium",
          browserMajor: "150",
          platformFamily: "ChromeOS",
          formFactor: "computer",
          logicalProcessorsBucket: "4-5",
          displayCadenceBucket: "53-76hz",
          reportedMemoryClass: "8+",
          fullUserAgent: "must-not-be-stored",
        },
        outcome: {
          score: 75,
          grade: "C+",
          confidence: "High",
          boundaryConfirmation: {
            triggered: true,
            reason: "grade-boundary",
            margin: 1,
            gradeBoundary: 74,
            plannedCategories: ["browsing", "email", "private-category"],
            runs: [
              { category: "browsing", tier: "extreme", addedSamples: 2 },
              { category: "private-category", privateNote: "must-not-be-stored" },
            ],
            scoreBefore: 74,
            gradeBefore: "C+",
            scoreAfter: 75,
            gradeAfter: "C+",
          },
          upperReserve: {
            tested: true,
            score: 89,
            gradeCeiling: 97,
            components: [
              { id: "memory", score: 84, privateNote: "must-not-be-stored" },
              { id: "private-component", score: 100 },
            ],
          },
          categories: {},
        },
        evidence: {
          memoryTiers: [
            {
              id: "memory-1024",
              targetMB: 1024,
              retainedMB: 1024,
              addedMB: 512,
              allocator: "webassembly",
              gcChurnMs: 62,
              gcWorstRoundMs: 18,
              gcObjectsCreated: 360000,
            },
          ],
        },
        integrity: {},
        email: "must-not-be-stored@example.com",
      }),
    },
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: {
        prepare(sql) {
          captured.sql = sql;
          return statement;
        },
      },
    },
  );

  assert.equal(response.status, 204);
  assert.match(captured.sql, /anonymous_benchmark_runs/);
  const serializedBindings = JSON.stringify(captured.values);
  assert.doesNotMatch(serializedBindings, /must-not-be-stored/);
  assert.match(serializedBindings, /6\.17\.0-upper-reserve/);
  assert.match(serializedBindings, /webassembly/);
  assert.match(serializedBindings, /grade-boundary/);
  assert.match(serializedBindings, /scoreBefore/);
  assert.match(serializedBindings, /upperReserve/);
  assert.match(serializedBindings, /\\"id\\":\\"memory\\"/);
  assert.doesNotMatch(serializedBindings, /private-component/);
});

test("server-renders the public methodology whitepaper", async () => {
  const response = await render("/methodology");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Measuring what a computer is still good for/);
  assert.match(html, /Browser-neutral compatibility adapters/);
  assert.match(html, /derive alphabetical ranks once/);
  assert.match(html, /Browser evidence boundary/);
  assert.match(html, /no post-score browser normalization/);
  assert.match(html, /Everyday capability and performance reserve/);
  assert.match(html, /Upper-reserve confirmation/);
  assert.match(html, /Memory hint and measured reserve/);
  assert.match(html, /What makes the result meaningful/);
  assert.match(html, /stillgood-methodology-v6\.17\.md/);
  assert.match(html, /href="https:\/\/github\.com\/PerceptLabs\/stillgood"/);
  assert.doesNotMatch(html, /flat browser bonus|user-agent bonus/i);
});
