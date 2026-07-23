# Codex Master Prompt

Use the following prompt after placing this specification pack in the repository.

---

You are building **StillGood**, a browser-based second-life computer usability benchmark.

Read every file in `docs/` in numeric order and treat them as the product source of truth. Also read `benchmark-profile.v1.json`. Read `11_AUTOMATION_FIRST_ADDENDUM.md` last; it supersedes guided user interactions and is authoritative wherever the earlier documents conflict with it.

## Immediate assignment

Implement Milestones 0–3 from `08_CODEX_IMPLEMENTATION_PLAN.md`:

1. repository foundation;
2. benchmark lifecycle and local storage;
3. pure scoring engine;
4. a complete automated Everyday Responsiveness vertical slice.

Do not implement video, storage pressure, anonymous uploads, accounts, analytics, leaderboards, or a backend in this assignment.

## Required stack

- Vanilla TypeScript
- Vite
- semantic HTML
- CSS without a component framework
- IndexedDB through a small project-owned wrapper
- Vitest
- Playwright
- strict TypeScript

Do not add React, Vue, Angular, Next.js, a charting library, an animation library, a fingerprinting library, or a third-party analytics SDK.

## Non-negotiable product rules

- Measure browser-observed experience, not unobservable hardware facts.
- Never phrase a symptom as a proven CPU, RAM, disk, thermal, or battery diagnosis.
- Keep benchmark workloads deterministic and local.
- Do not include network load time in device scoring.
- Stop or invalidate measured rounds when the tab is hidden or materially resized.
- Preserve raw metrics and a calculation trace.
- Keep the score configuration external and versioned.
- No account or upload.
- Respect accessibility requirements and do not score user typing speed.
- Keep the app shell lightweight enough for old hardware.

## Implementation expectations

Before coding:

1. summarize the architecture you will implement;
2. list any ambiguity you found and the conservative assumption you chose;
3. identify the files you expect to create or modify.

Then implement the working vertical slice.

The vertical slice must let a user:

- open the landing page;
- choose Quick Check;
- pass preflight;
- start the benchmark once and then leave it unattended;
- watch the simulated inbox responsiveness module perform deterministic actions automatically;
- collect preferred Event Timing metrics where supported;
- use a documented two-animation-frame fallback otherwise;
- collect long-task or event-loop-lag diagnostics;
- calculate a category score using the profile;
- see a simple result page;
- inspect technical details;
- export JSON;
- recover from an interrupted run.

## Testing expectations

Add tests for:

- every scoring threshold;
- interpolation and clamping;
- gate rules already relevant to the prototype;
- controller state transitions;
- interruption invalidation;
- fallback metric labeling;
- IndexedDB checkpoint recovery;
- keyboard navigation outside an active measured run.

Use fixed seeds and golden fixtures. Do not assert real millisecond performance in CI.

## Delivery format

At completion, provide:

1. concise implementation summary;
2. architecture decisions made;
3. tests added and commands to run them;
4. bundle-size result;
5. known limitations;
6. exact next milestone recommendation.

Do not silently deviate from the specifications. When a requirement is impossible in a browser, preserve the limitation in the interface and documentation rather than faking the metric.

---
