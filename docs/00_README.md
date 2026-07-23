# StillGood — Codex Specification Pack

**Working title:** StillGood  
**Product:** A browser-based second-life computer usability test  
**Spec version:** 1.0-draft + automation-first addendum  
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

Read the automation-first addendum after the base documents. Where it conflicts
with guided or manual benchmark interaction requirements, the addendum takes
precedence.

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

The MVP is a static progressive web app that:

- runs a guided 6–10 minute test;
- measures responsiveness, document work, smoothness, multitasking, video, and local browser storage;
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
