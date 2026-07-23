# QA and Validation Plan

## 1. Quality goals

StillGood must be technically reliable and empirically useful. These are separate goals:

- **Software QA:** the app works correctly.
- **Benchmark repeatability:** repeated runs under stable conditions agree.
- **Usability validity:** results correspond to how people experience the device.
- **Interpretation safety:** the app does not claim more than it measured.

## 2. Automated test layers

## 2.1 Unit tests

Required coverage:

- interpolation at every threshold point;
- clamping above and below ranges;
- missing optional metrics;
- missing required metrics;
- category weighting;
- grade bands;
- all gate rules;
- role badge requirements;
- confidence rules;
- recommendation-pattern rules;
- export schema;
- seeded fixture generation;
- percentile and variation calculations.

Target: 95% coverage of scoring and recommendation code.

## 2.2 Integration tests

- benchmark controller state transitions;
- collector start/stop/reset behavior;
- interruption handling;
- service-worker asset verification;
- IndexedDB checkpoint and recovery;
- worker cancellation and deadlines;
- partial-result calculations;
- browser fallback selection.

## 2.3 End-to-end tests

Using Playwright:

- complete Quick Check in Chromium;
- complete Full Test in Chromium;
- complete supported path in Firefox;
- skip motion and video;
- hide and restore tab/module simulation where possible;
- resize invalidation;
- asset failure;
- worker crash;
- interrupted-run recovery;
- export JSON;
- print result;
- compare two local runs;
- keyboard-only completion;
- reduced-motion path.

Do not use E2E timing numbers as hardware calibration data; virtualized CI timing is only for functional assertions.

## 3. Cross-browser test matrix

At minimum:

- Chromium current stable on Linux and Windows;
- Firefox current stable on Linux and Windows;
- Safari current stable on macOS for graceful degradation;
- one older but still supported Chromium version on low-end hardware.

Record which APIs are used in each run.

## 4. Reference-device matrix

Start with at least 12 physical reference configurations spanning:

### Very limited

- dual-core low-power Chromebook-era CPU, 4 GB RAM, eMMC;
- entry-level Celeron-class laptop, 4 GB RAM;
- Raspberry Pi-class ARM device where supported.

### Older but practical

- 4th–6th generation mobile Core i5, 8 GB, SATA SSD;
- Core m-class fanless system, 8 GB;
- older AMD APU laptop, 8 GB.

### Comfortable baseline

- 8th–10th generation Core i5 or Ryzen 5, 8–16 GB;
- modern low-end N-series or equivalent;
- current mainstream laptop.

Test each with at least:

- current Chromium;
- current Firefox where practical;
- normal profile;
- clean browser profile on a subset.

## 5. Repeatability protocol

For each reference configuration:

1. reboot;
2. wait five minutes or until background activity settles;
3. record power state;
4. run Full Test three times;
5. allow two minutes between runs;
6. repeat on a second day;
7. compare category and overall variance.

Acceptance targets:

- median overall range across three same-session runs ≤7 points;
- median category range ≤10 points;
- fewer than 5% unexplained invalid runs;
- high-variance systems are flagged rather than silently averaged.

## 6. Human validation study

### Goal

Calibrate objective measurements against perceived comfort and task success.

### Participants

Initial target:

- 20–30 participants;
- varied technical experience;
- include users accustomed to low-end devices and users accustomed to modern devices;
- include accessibility needs where possible.

### Procedure

Each participant uses 4–6 devices in counterbalanced order. For each device:

1. complete a standardized email-like task;
2. search and edit a document;
3. play video while switching tasks;
4. rate each category:
   - comfortable;
   - acceptable;
   - frustrating;
   - unusable;
5. answer whether they would willingly use the device for that role.

The benchmark runs separately or in an instrumented equivalent flow.

### Analysis

- compare objective category score with ordinal comfort rating;
- inspect false-positive “Ready” badges;
- inspect false-negative low scores;
- use monotonic calibration methods rather than opaque overfit models;
- preserve understandable threshold tables;
- validate on held-out devices.

### Release condition for non-experimental label

Do not remove the Experimental label until:

- at least 30 distinct device configurations are represented;
- at least 100 valid human-rated sessions exist;
- severe role-badge mismatch is under 10%;
- thresholds are published and frozen as a version.

## 7. Low-end app performance testing

The benchmark app itself must be tested on the lowest reference device.

Acceptance:

- landing page usable before benchmark assets load;
- no idle main-thread task >100 ms caused by decorative UI;
- result page remains scrollable while charts render;
- no memory leak across three consecutive runs;
- app history with 50 results remains responsive;
- stopping a pressure test responds within 1 second whenever the browser is still scheduling input.

## 8. Accessibility QA

- automated accessibility scan on every route;
- manual keyboard test;
- screen-reader smoke test in NVDA and VoiceOver where available;
- 200% zoom;
- forced-colors/high-contrast check;
- reduced-motion path;
- no reliance on drag-only interactions;
- status messages announced without excessive chatter.

## 9. Privacy QA

Verify through network inspection:

- no requests during timed modules after caching;
- no third-party calls;
- no result upload without explicit action;
- exports contain no local database identifiers or fingerprint hashes;
- deleting local history removes stored results;
- service worker does not cache personal external pages.

## 10. Benchmark-change policy

Any change to:

- workload fixture;
- module duration;
- metric composition;
- threshold table;
- category weight;
- gate rule;
- role requirement;

requires a new benchmark-profile version and changelog entry.

UI-only and bug-fix releases may keep the profile version when they do not change measured behavior.

## 11. Bug severity

### Critical

- data uploaded without consent;
- pressure continues after cancellation;
- score calculation is wrong;
- result claims unsupported hardware diagnosis;
- benchmark asset corruption goes undetected.

### High

- frequent invalid runs;
- missing checkpoint causes lost completed modules;
- hidden-tab run receives valid score;
- browser-specific crash;
- inaccessible core flow.

### Medium

- recommendation mismatch;
- export formatting issue;
- local history comparison warning missing;
- nonessential fallback unavailable.
