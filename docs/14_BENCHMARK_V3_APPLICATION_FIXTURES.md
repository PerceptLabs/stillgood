# StillGood Benchmark v3 — Application Fixtures

## Why v3 exists

Version 2 used the same deterministic array-generation, sorting, filtering, and
simple row-rendering loop for both the everyday-app and document categories.
That produced repeatable JavaScript and DOM pressure, but it did not justify
separate email and office capability claims.

Version 3 replaces that shared loop with two purpose-built, locally hosted
application fixtures.

## Scripted inbox journey

Each measured repetition performs five distinct operations against a
deterministic message dataset:

1. Search message sender, subject, and body fields.
2. Open a conversation and render its preview.
3. Select and label a group of messages while sorting by sender.
4. Compose and render a reply draft.
5. Switch from the inbox to the archive folder.

The fixture renders realistic inbox controls, folders, message states, labels,
preview content, and a composer. Every action includes a success assertion and
records its individual processing and end-to-end duration.

## Scripted document journey

Each measured repetition performs five distinct operations against a
deterministic multiparagraph document and inventory table:

1. Find and highlight matching text.
2. Edit a paragraph.
3. Apply rich-text emphasis across multiple paragraphs.
4. Sort an inventory table by year and model.
5. Serialize, reopen, and rerender the document.

The fixture uses an editable document surface, toolbar, search state,
paragraphs, highlighting, formatting, and a real HTML table. Every action has a
success assertion.

## Timing boundary

Dataset construction is excluded from measurement. Each scripted action starts
inside `requestAnimationFrame`, performs its application computation, commits
the React update synchronously, and completes after the following rendering
opportunity and a zero-delay task. This captures the application work plus the
browser work needed to reconcile, style, lay out, and present the changed DOM.

Warm-ups remain unscored. Every tier has three measured repetitions, with raw
per-action durations included in the exported evidence.

## Controlled video ladder

All three media tiers now use the same deterministic moving `testsrc2` content,
encoded as H.264 High Profile at 30 fps for six seconds. Resolution is the
primary intentional variable:

- 854×480
- 1280×720
- 1920×1080

All clips use yuv420p, CRF 23, level 4.0, a 60-frame GOP, and fast-start MP4
metadata. A tier must advance media time and report a credible frame count
before it can affect capability recommendations.

## Remaining limitations

These fixtures approximate webmail, rich-text editing, and tabular office work.
They do not measure a native email client, Microsoft Office, LibreOffice,
system-wide memory pressure, or physical storage throughput. Role labels remain
experimental until physical-device results are compared with human comfort
ratings.
