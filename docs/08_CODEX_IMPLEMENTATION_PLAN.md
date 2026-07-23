# Codex Implementation Plan

## Operating instructions for the coding agent

- Treat the specification pack as authoritative.
- Do not replace browser-observable language with hardware diagnoses.
- Keep dependencies minimal.
- Implement a working vertical slice before visual polish.
- Add tests with every scoring or lifecycle feature.
- Commit benchmark fixtures and profile configuration as versioned assets.
- Do not add analytics, accounts, or a backend.

## Milestone 0 — Repository foundation

### Tasks

- Initialize Vite + Vanilla TypeScript project.
- Enable strict TypeScript.
- Add linting, formatting, Vitest, and Playwright.
- Add routes and lightweight app shell.
- Add CSS tokens and accessible base components.
- Copy `benchmark-profile.v1.json` into the project.
- Add schema types and a manual validator.

### Acceptance criteria

- `npm run build`, `npm test`, and E2E smoke test pass.
- Landing, Prepare, Methodology, Privacy, and empty Result routes work.
- Compressed shell remains within the initial budget.

## Milestone 1 — Benchmark lifecycle and local storage

### Tasks

- Implement benchmark controller state machine.
- Implement module interface.
- Implement capability detection.
- Implement integrity monitor for visibility, focus, and resize.
- Add IndexedDB result/checkpoint storage.
- Add interrupted-run recovery UI.
- Add Quick and Full mode definitions.

### Acceptance criteria

- A fake module can run, pause, fail, retry, complete, and export.
- Hidden-tab and resize conditions invalidate a round.
- Reload during a fake module is detected on return.

## Milestone 2 — Scoring engine

### Tasks

- Implement percentile and robust variation utilities.
- Implement piecewise interpolation.
- Implement category weighting.
- Implement grade bands and gate rules.
- Implement role-badge engine.
- Implement confidence engine.
- Implement recommendation rules.
- Add exhaustive threshold tests.

### Acceptance criteria

- Golden fixture results match expected scores exactly.
- No scoring code depends on DOM or global browser state.
- Result includes complete calculation trace.

## Milestone 3 — Everyday responsiveness vertical slice

### Tasks

- Build local inbox/work-desk fixture.
- Add user action sequence.
- Implement Event Timing collector.
- Implement two-rAF fallback collector.
- Implement Long Task collector and event-loop fallback.
- Add frame cadence collector.
- Build module result card.

### Acceptance criteria

- At least 10 valid interactions collected.
- Preferred/fallback source is visible in technical details.
- User typing speed is not scored.
- Repeated fixture runs are deterministic.

## Milestone 4 — Documents module

### Tasks

- Create deterministic document fixture generator.
- Implement heading navigation, search, table sort, edit, save, reopen.
- Record specified timings.
- Ensure long content does not crash the lowest target device.

### Acceptance criteria

- Known search term count is verified.
- Save/reopen integrity is tested.
- Module works keyboard-only.

## Milestone 5 — Multitasking and recovery

### Tasks

- Implement worker calibration.
- Implement text-index and data-transform workers.
- Add optional image worker with OffscreenCanvas fallback.
- Implement cancellation and heartbeat.
- Implement interactive foreground task.
- Implement recovery detector.
- Add emergency early-stop rule.

### Acceptance criteria

- Worker pressure target is approximately 8 seconds across reference tiers.
- Stop button cancels workers.
- App does not deliberately freeze for more than the safety limit.
- Recovery time is captured.

## Milestone 6 — Smoothness and video

### Smoothness tasks

- Implement refresh-cadence calibration.
- Implement deterministic motion scene.
- Calculate late-frame ratio and p95 frame interval.
- Add reduced-motion opt-in behavior.

### Video tasks

- Add versioned local MP4/WebM clips at 1080p and 720p.
- Implement codec selection.
- Implement playback-quality collector.
- Implement seek sequence and tier fallback.

### Acceptance criteria

- Backgrounding invalidates the round.
- Codec and tier appear in details.
- User can skip motion and video.
- No network timing is included after preparation.

## Milestone 7 — Browser storage

### Tasks

- Implement temporary IndexedDB workload.
- Bound data volume and transaction size.
- Add cleanup verification.
- Add quota-aware reduction.

### Acceptance criteria

- Temporary database is deleted after success, failure, or cancellation.
- Storage score is correctly capped in overall gate logic.
- UI labels it browser storage, not disk speed.

## Milestone 8 — Results, history, comparison, export

### Tasks

- Build grade hero and role badges.
- Build category cards and details disclosures.
- Build limitation and recommendation sections.
- Build local history.
- Build comparison view with version/browser warnings.
- Add JSON export, copyable text, and print CSS.

### Acceptance criteria

- First screenful communicates grade, use cases, limit, and confidence.
- Technical details expose raw metrics and score trace.
- Comparison refuses silent apples-to-oranges interpretation.

## Milestone 9 — PWA and offline

### Tasks

- Implement service worker.
- Cache shell and immutable benchmark assets.
- Verify asset hashes before testing.
- Add offline-ready status.
- Add update flow that never changes assets mid-run.

### Acceptance criteria

- A completed first load supports a full offline repeat run.
- New service worker waits until no benchmark is active.
- Timed modules perform no network requests.

## Milestone 10 — Hardening

### Tasks

- Complete E2E matrix.
- Accessibility audit.
- Bundle audit.
- Memory leak check.
- Three-run stability check on low-end hardware.
- Publish methodology and version changelog.

### Acceptance criteria

- Meets QA plan release criteria for Experimental MVP.
- No critical or high-severity open defects.
- All known browser limitations are documented.

## Suggested first Codex assignment

Build Milestones 0–3 only. Deliver a functional Quick Check prototype with the full architecture boundaries in place. Do not attempt all modules in a single unreviewed change.

## Definition of done for every milestone

- implementation;
- unit tests;
- relevant E2E coverage;
- accessibility check;
- updated documentation;
- no unexplained dependency growth;
- no change to benchmark behavior without profile version review.
