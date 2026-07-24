import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function boxStart(buffer, type) {
  const needle = Buffer.from(type, "ascii");
  let marker = -1;
  while ((marker = buffer.indexOf(needle, marker + 1)) >= 4) {
    const start = marker - 4;
    const size = buffer.readUInt32BE(start);
    if (size >= 8 && start + size <= buffer.length) return start;
  }
  assert.fail(`${type} box is present`);
}

function trackDimensions(buffer) {
  const start = boxStart(buffer, "avc1");
  return {
    width: buffer.readUInt16BE(start + 32),
    height: buffer.readUInt16BE(start + 34),
  };
}

function movieDuration(buffer) {
  const start = boxStart(buffer, "mvhd");
  const version = buffer.readUInt8(start + 8);
  assert.equal(version, 0, "fixture uses a version-0 movie header");
  const timescale = buffer.readUInt32BE(start + 20);
  const duration = buffer.readUInt32BE(start + 24);
  return duration / timescale;
}

for (const [name, width, height] of [
  ["video-480p.mp4", 854, 480],
  ["video-720p.mp4", 1280, 720],
  ["video-1080p.mp4", 1920, 1080],
]) {
  test(`${name} is a fast-start six-second H.264 fixture`, async () => {
    const buffer = await readFile(
      new URL(`../public/benchmark-assets/${name}`, import.meta.url),
    );
    assert.ok(buffer.length > 200_000);
    assert.ok(buffer.indexOf(Buffer.from("moov")) < buffer.indexOf(Buffer.from("mdat")));
    assert.ok(buffer.includes(Buffer.from("avc1", "ascii")));
    assert.deepEqual(trackDimensions(buffer), { width, height });
    assert.ok(Math.abs(movieDuration(buffer) - 6) < 0.05);
  });
}
