import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
  assert.match(html, /Usually about one minute/);
  assert.doesNotMatch(html, /Method v3/);
  assert.match(html, /A second-life computer check/);
  assert.match(html, /Everyday apps/);
  assert.match(html, /Scripted inbox search, opening, selection, composing, and folders/);
  assert.match(html, /Scripted rich-text finding, editing, formatting, tables, and saving/);
  assert.match(html, /Local H\.264 clips at 480p, 720p, and 1080p/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});
