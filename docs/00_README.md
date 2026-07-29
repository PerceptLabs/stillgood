# StillGood — Codex Specification Pack

**Working title:** StillGood  
**Product:** A browser-based second-life computer usability test  
**Spec version:** 2.0-experimental methodology
**Benchmark profile:** v1  

## Purpose

StillGood answers a practical question that conventional benchmarks do not:

> Is this older computer comfortable enough for email, documents, video, and modest multitasking—and what is it still good for?

This pack is designed to be placed in a repository and given to Codex as the source of truth for designing and building the application.

## Recommended reading order

1. `01_PRD.md` — product goals, users, scope, success criteria
2. `02_BENCHMARK_METHODOLOGY.md` — test design and measurement rules
3. `03_SCORING_AND_RUBRIC.md` — scoring, grades, roles, confidence
4. `04_UX_AND_CONTENT_SPEC.md` — screens, interaction flow, wording
5. `05_TECHNICAL_ARCHITECTURE.md` — stack, modules, APIs, data flow
6. `06_PRIVACY_ACCESSIBILITY_AND_INTEGRITY.md` — non-negotiable constraints
7. `07_QA_AND_VALIDATION_PLAN.md` — testing and calibration plan
8. `08_CODEX_IMPLEMENTATION_PLAN.md` — phased build backlog
9. `09_CODEX_MASTER_PROMPT.md` — ready-to-paste build instruction
10. `10_RESEARCH_BASIS.md` — standards and research behind the decisions
11. `benchmark-profile.v1.json` — machine-readable weights and thresholds
12. `11_AUTOMATION_FIRST_ADDENDUM.md` — authoritative unattended benchmark revisions
13. `12_FAST_CHECK_RESEARCH_DECISION.md` — authoritative duration, test-count, and result simplification
14. `13_BENCHMARK_V2_METHODOLOGY.md` — current implemented benchmark and scoring methodology
15. `14_BENCHMARK_V3_APPLICATION_FIXTURES.md` — purpose-built email and document fixtures
16. `15_BENCHMARK_V4_OFFICE_WORKLOADS.md` — authoritative large-email, writing, and spreadsheet revision
17. `16_BENCHMARK_V5_BALANCED_EVERYDAY_USE.md` — authoritative browsing and balanced-score revision
18. `17_BENCHMARK_V6_ADAPTIVE_HEADROOM.md` — authoritative adaptive limit-finding revision
19. `18_BENCHMARK_V6_1_REFRESH_NORMALIZATION.md` — authoritative high-refresh graphics correction

20. `19_BENCHMARK_V6_2_CONSISTENCY_AND_HEADROOM.md` — action-tail, hitch, preflight, continuous graphics, and reserve rules

21. `20_BENCHMARK_V6_3_CALIBRATION_AND_HISTORY.md` — corrected adaptive reserve scoring and authenticated automatic run history

22. `21_BENCHMARK_V6_4_PRACTICAL_GRADE_LADDER.md` — stricter modern-performance grade bands

23. `22_BENCHMARK_V6_5_MEMORY_AND_PERSISTENT_STORAGE.md` — controlled memory-pressure and durable browser-storage checks

24. `23_BENCHMARK_V6_6_ADAPTIVE_MEMORY_AND_STORAGE_TAILS.md` — larger active-memory tiers, repeated persistent-file tests, and tail-aware practical scoring

25. `24_BENCHMARK_V6_7_GRANULAR_GRADE_LADDER.md` — narrower A–E grade strata

26. `25_BENCHMARK_V6_8_BROWSER_NEUTRAL_MEDIA_AND_HEADROOM.md` — duration-based media stalls and separated everyday capability

27. `26_V6_8_REFERENCE_REPLAY.md` — paired Chromium and Firefox regression replay

28. `27_BENCHMARK_V6_9_COMPATIBILITY_ADAPTERS.md` — browser-neutral workload and measurement adaptation policy

29. `28_BENCHMARK_V6_10_ISOLATED_GRAPHICS_ADAPTER.md` — capability-gated separation of an isolated browser graphics limitation

30. `STILLGOOD_METHODOLOGY_WHITEPAPER.md` — public methodology and validity explanation

Read the automation-first addendum after the base documents. Where it conflicts
with guided or manual benchmark interaction requirements, the addendum takes
precedence.

Read the Fast Check decision last. Where it conflicts with earlier duration,
module-count, or result-presentation requirements, the Fast Check decision takes
precedence for the primary public test.

For implementation work, Benchmark Methodology v2 supersedes the Fast Check
decision where their durations, repetition policies, media ladders, category
weights, or grade bands conflict.

Benchmark v5 keeps the v4 office fixtures but supersedes its overall category
weights, grade guardrails, module count, and general-use positioning.

Benchmark v6 keeps the v5 balanced categories but supersedes its latency-tier
progression, weighting, and practical-limit reporting.

Benchmark v6.1 keeps v6's categories and headroom behavior but supersedes its
graphics scheduling and refresh-rate comparison method.

Benchmark v6.2 keeps v6.1's workloads and display normalization but supersedes
its action-tail interpretation, graphics scoring, preflight stability, and
performance-reserve reporting.

Benchmark v6.3 keeps v6.2's workloads and measurements but supersedes its
adaptive-headroom ceiling, A+ threshold, and result-storage behavior for the
authenticated internal deployment.

Benchmark v6.4 keeps v6.3's measurements, continuous index, headroom rules, and
private history but supersedes its letter-grade thresholds and result wording.

Benchmark v6.5 keeps v6.4's balanced everyday workloads and grade ladder while
adding browser-observable memory-pressure and persistent-save evidence. It also
requires a reserve score of at least 88 for B+.

Benchmark v6.6 keeps v6.5's checks but supersedes its memory ladder, OPFS file
sizes and repetition policy, storage aggregation, reserve contribution, and
large-save result wording.

Benchmark v6.7 keeps every v6.6 workload, measurement, score, cap, and penalty
unchanged while replacing broad letter bands with a more granular grade ladder.
This prevents scores near opposite ends of adjacent ten-point bands from
appearing nearly equivalent.

Benchmark v6.8 keeps the v6.7 grade ladder and all workload fixtures while
measuring media waiting duration instead of event count and separating ordinary
core capability from adaptive reserve tiers. It contains no browser-name checks.

Benchmark v6.9 formalizes browser-neutral compatibility adapters. Fixed-locale
alphabetical ranks are derived once for the fixture's unique labels, so timed
large-array sorts preserve the intended ordering without repeatedly initializing
collation. No adapter changes workload size, score thresholds, or results by
browser name.

Benchmark v6.10 keeps every v6.9 workload and threshold while separating one
narrow browser-graphics outlier from the computer grade. The rule requires
limited frame telemetry, strong core evidence, verified video, and a graphics
result at least 30 points below the core median. The visual result remains
prominent. Chromium reference scores are unchanged.

Benchmark v6.11 removes a separate reserve-scoring cliff for a
telemetry-limited browser that completes every maximum adaptive tier while all
ordinary work remains excellent. Reserve still caps the result proportionally,
but it no longer forces B+ solely because the headroom score fell one point
below 88. The full-telemetry Chromium path is unchanged.

Benchmark v6.12 replaces the conditional v6.10 and v6.11 scoring exceptions
with a versioned Firefox reference calibration. Chromium is the frozen
reference path and receives identity factors. Firefox graphics and aggregate
headroom are transformed with provisional multiplicative factors derived from
matched HP and Dell runs. Raw Firefox evidence remains exported and visible.

`STILLGOOD_METHODOLOGY_WHITEPAPER.md` is the public technical explanation of
the benchmark's goals, protocol, workloads, measurement, scoring, validity, and
limitations.

`STILLGOOD_COMPLETE_SPEC.md` combines the documents into one file for tools that work better with a single context document.

## Product principles

- **Measure experience, not prestige.** A low-end computer can earn a good role-specific result.
- **Use understandable outputs.** “Web and Email Ready” is more useful than “1,824 points.”
- **Do not pretend the browser can see the whole system.** Results are browser-and-configuration specific.
- **Be kind to old hardware.** The benchmark itself must be lightweight, stable, and recoverable.
- **No account required.** The MVP works locally and can run offline after the first load.
- **Transparent scoring.** Every grade can be traced to visible metrics and thresholds.
- **Repeatable by default.** Bundled local workloads avoid changing websites, advertisements, and network speed.

## MVP definition

The primary public MVP is a static progressive web app that:

- runs one unattended test in roughly two to four minutes, ending heavy tiers early when necessary;
- presents nine understandable checks while retaining repeated measurements internally;
- measures web browsing, email, documents, spreadsheets, smoothness, multitasking, video, responsiveness under memory pressure, and persistent browser storage;
- produces an A–E Second-Life Rating;
- assigns clear role badges;
- explains bottlenecks as observed symptoms, not hardware diagnoses;
- exports a shareable JSON and printable result;
- stores results locally unless the user explicitly opts into sharing;
- works in current Chromium and Firefox, with graceful degradation elsewhere.

## Explicitly out of scope for MVP

- boot-time measurement;
- system-wide CPU, RAM, swap, temperature, or SMART data;
- battery-health diagnosis;
- gaming, AI, compilation, or creator-workload benchmarking;
- permanent user accounts;
- global leaderboards;
- claiming that results from different browsers are directly interchangeable.

## Suggested repository layout

```text
stillgood/
├─ docs/                         # this specification pack
├─ public/
│  ├─ benchmark-assets/
│  │  ├─ document-fixture.json
│  │  ├─ images/
│  │  └─ video/
│  └─ icons/
├─ src/
│  ├─ app/
│  ├─ benchmark/
│  │  ├─ modules/
│  │  ├─ metrics/
│  │  ├─ scoring/
│  │  └─ workers/
│  ├─ components/
│  ├─ content/
│  ├─ storage/
│  └─ styles/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ benchmark-profile.v1.json
├─ package.json
└─ README.md
```

## Definition of success

A first-time user should be able to run the test without technical knowledge and understand the final result in under 30 seconds. A developer should be able to change thresholds or weights without rewriting the application.
