# StillGood Complete Specification

> Combined on 2026-07-19. Individual source files remain authoritative.


---

# StillGood — Codex Specification Pack

**Working title:** StillGood  
**Product:** A browser-based second-life computer usability test  
**Spec version:** 1.0-draft  
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

# Addendum: Benchmark v6 adaptive headroom

The authoritative adaptive-limit revision is maintained in
`17_BENCHMARK_V6_ADAPTIVE_HEADROOM.md`. StillGood now extends browsing, email,
document, and spreadsheet workloads only after the ordinary top tier completes
quickly and consistently. Unattempted extensions do not count as failures.
Measured extensions identify whether a practical limit was found, an extended
range passed, or the benchmark still did not reach the system's limit.

# Addendum: Benchmark v6.1 refresh-normalized graphics

Graphics scenes are scheduled and graded against a fixed 60 fps usability
target on displays capable of at least 60 Hz. The native display cadence remains
part of the evidence, but no longer increases the graded workload. See
`18_BENCHMARK_V6_1_REFRESH_NORMALIZATION.md` for the authoritative revision.

---

# Benchmark v5 balanced everyday-use addendum

Benchmark v5 keeps the detailed email, writing, and spreadsheet fixtures from
v4 while restoring StillGood as a general second-life computer check.

It adds a deterministic local browsing module covering articles, search
results, shopping pages, busy home pages, filters, and pagination. The eight
public modules are browsing, email, documents, spreadsheets, visual smoothness,
video, multitasking, and browser storage/recovery.

The overall weights are: browsing 22%, email 9%, writing 9%, spreadsheets 10%,
multitasking 17%, visual smoothness 13%, video 12%, browser storage 3%, and
recovery 5%. Office therefore contributes 28%, not a majority.

Browsing is a core category. Weak visual-smoothness or video results can prevent
an A grade even when office results are excellent. Internal dataset sizes remain
available in exported diagnostic data but are not shown as user-facing
capability claims.

The full decision record is in
`16_BENCHMARK_V5_BALANCED_EVERYDAY_USE.md`.

---

# Authoritative implementation update — Benchmark v4

The implemented public benchmark now follows
`15_BENCHMARK_V4_OFFICE_WORKLOADS.md`. That addendum supersedes earlier
office-fixture, module-count, duration, repetition, office-weight, and
office-label requirements. Email, writing, and spreadsheets are separate
measured categories using five repetitions per tier and continuous latency
scoring. The public run contains seven sections and normally takes two to four
minutes.

## Definition of success

A first-time user should be able to run the test without technical knowledge and understand the final result in under 30 seconds. A developer should be able to change thresholds or weights without rewriting the application.

---

# Product Requirements Document

## 1. Product summary

**StillGood** is a browser-based usability benchmark for older, refurbished, inexpensive, and second-life computers. It measures whether the device remains comfortable for ordinary tasks and translates measured behavior into clear recommendations.

Conventional benchmarks answer questions such as “How many operations per second?” StillGood answers:

- Does typing stay responsive?
- Can the browser handle several everyday tasks at once?
- Does a document remain usable while background work is happening?
- Can the device play common video smoothly?
- Does it recover promptly after pressure ends?
- Which roles are a good fit for this machine?

## 2. Problem statement

People refurbishing or evaluating old computers lack a simple, trustworthy test for practical usability. Existing browser benchmarks are valuable for comparing engines and compute performance, but they often produce abstract scores, focus on peak throughput, or omit the complete experience of interaction latency, stutter, memory pressure, recovery, and role suitability.

The result is avoidable waste. Machines are discarded because they are “old,” while other machines are overpromised based on a benchmark score that does not reflect daily use.

## 3. Product vision

Create the most understandable and accessible standard for answering:

> What can this computer still do comfortably?

The long-term product can become a shared language for refurbishers, schools, families, Linux communities, repair shops, recyclers, and buyers of inexpensive used hardware.

## 4. Target users

### Primary users

**Home refurbisher**  
Installs Linux, ChromeOS Flex, or a lightweight operating system and wants to evaluate the result.

**Used-device buyer or seller**  
Needs a plain-language description of actual usability rather than a processor name alone.

**Community repair or donation program**  
Needs a repeatable intake test and a role recommendation for many different devices.

### Secondary users

- schools and nonprofit technology programs;
- retro and low-end computing enthusiasts;
- repair shops;
- Linux distribution maintainers;
- browser and web-performance developers.

## 5. Jobs to be done

1. When I revive an old computer, help me determine whether it is worth keeping in general use.
2. When I give or sell a computer to someone, help me describe what it handles comfortably.
3. When a machine feels slow, help me identify the kind of friction I am experiencing.
4. When I change the operating system, browser, extensions, or power settings, help me compare before and after.
5. When a machine is limited, help me find a narrower role rather than declaring it worthless.

## 6. Product principles

1. **Human-visible delay matters more than peak throughput.**
2. **A role-specific pass is a valid success.**
3. **The result must be understandable without benchmark knowledge.**
4. **The benchmark must be deterministic enough for before-and-after comparisons.**
5. **The app must disclose browser limitations.**
6. **Privacy is the default, not an account setting.**
7. **The test must not punish accessibility settings or require dangerous stress.**
8. **The score model must be versioned and auditable.**

## 7. Core user journey

1. User opens StillGood.
2. Landing page explains the purpose in one sentence.
3. Preflight checks browser support, viewport, visibility, power-condition answer, and asset availability.
4. User chooses:
   - **Quick Check** — approximately 4 minutes; core modules only.
   - **Full Test** — approximately 8 minutes; all modules and role badges.
5. App warms up and caches benchmark assets.
6. User completes short guided interactions while automated measurements run.
7. App validates the run and flags interruptions or excessive variance.
8. User receives:
   - overall grade;
   - role badges;
   - category results;
   - confidence level;
   - observed limitations;
   - practical improvement suggestions.
9. User may print, export JSON, save locally, or compare with a previous run.

## 8. Test modules

### 8.1 Preflight and warm-up — not scored

- Verify secure context where required.
- Detect supported performance APIs.
- Confirm tab is visible and focused.
- Check that viewport meets the minimum practical size.
- Load all benchmark assets before timing.
- Run a brief warm-up to reduce first-execution distortion.
- Ask whether the device is plugged in, on battery, or unknown.
- Record browser family/version when available without creating a fingerprint.

### 8.2 Everyday responsiveness — 30%

A simulated inbox and document-composer interface measures:

- click/tap-to-paint latency;
- typing presentation delay;
- list filter and sort response;
- DOM update latency;
- long tasks and blocked time;
- missed animation frames during ordinary interface work.

### 8.3 Documents and search — 20%

A bundled document fixture containing text, headings, tables, and images measures:

- initial render;
- text search response;
- table sorting/filtering;
- editing responsiveness;
- save-to-local-browser-storage latency.

The fixture is local and versioned. It must not depend on Google Docs, Microsoft 365, or a live PDF website.

### 8.4 Multitasking and recovery — 25%

While the user continues a small typing and navigation task, bounded Web Worker workloads create background pressure. Measure:

- interaction latency under pressure;
- long-task ratio;
- audio continuity when applicable;
- worker completion throughput;
- time for responsiveness to recover after the pressure stops.

The module must scale its workload after a calibration pass so it does not instantly overwhelm very slow devices or finish invisibly on fast devices.

### 8.5 Visual smoothness — 10%

A deterministic animation and scrolling scene measures:

- frame interval distribution;
- percentage of late frames relative to detected refresh cadence;
- long animation frames where supported;
- recovery after a brief complexity increase.

This is not a GPU benchmark. It measures whether ordinary browser motion appears smooth.

### 8.6 Video playback — 10%

Play a short, bundled 1080p30 test clip using a supported common codec. Measure:

- playback start after assets are cached;
- dropped-frame percentage;
- late video callbacks where supported;
- seeking recovery;
- audio continuity.

If 1080p cannot play acceptably, retry at 720p and report the highest comfortable tier.

### 8.7 Browser storage — 5%

Use IndexedDB for a small, bounded test:

- sequential writes;
- transaction latency;
- random reads;
- cleanup success.

Clearly label this as **browser storage responsiveness**, not raw disk speed. It receives low weight because caching and browser implementation can influence results.

## 9. Result model

### Overall rating

- **A — Comfortable:** feels like a normal basic computer.
- **B — Useful:** clearly practical, with minor limits.
- **C — Light-duty:** worthwhile for lighter use and deliberate multitasking.
- **D — Single-purpose:** best for one narrow job at a time.
- **E — Struggling:** not practical for the tested general web workload.

### Role badges

- Web and Email Ready
- Office Ready
- Media Ready
- Multitasking Ready
- Thin-Client Ready
- Single-Purpose Candidate

### Confidence

- High
- Medium
- Low
- Invalid run

## 10. Functional requirements

### FR-1: No-account testing

A user can complete the full benchmark without signing in.

### FR-2: Offline repeat runs

After the first successful asset load, the app can run again without network access.

### FR-3: Versioned benchmark

Every result includes:

- application version;
- benchmark profile version;
- fixture version;
- browser context;
- timestamp;
- run conditions supplied by the user.

### FR-4: Graceful feature detection

Unsupported APIs use documented fallbacks or mark a metric unavailable. Unsupported optional metrics do not automatically fail the device.

### FR-5: Interrupt protection

If the tab becomes hidden, loses focus for a meaningful interval, the window is resized substantially, or an asset fails, pause or invalidate the affected module.

### FR-6: Local history

Store previous results locally and allow side-by-side comparison.

### FR-7: Export

Allow:

- printable report;
- JSON export;
- copyable text summary;
- optional result image in a later release.

### FR-8: Actionable recommendations

Recommendations must be symptom-based and probabilistic. Example:

> Video was the only weak category. Hardware decoding, codec support, or browser configuration may be limiting playback. Try another current browser and compare.

Never state an unobserved diagnosis as fact.

### FR-9: Partial tests

Users may skip video or motion-heavy modules. The result must clearly state that the overall score is partial and recalculate weights only among completed modules; a partial result cannot receive High confidence.

### FR-10: Manual hardware checklist

Offer an optional, separate checklist for:

- cold boot;
- sleep/wake;
- keyboard and trackpad;
- Wi-Fi reconnection;
- ports;
- battery runtime;
- display defects;
- physical battery warning signs.

These produce badges and notes, not the browser performance grade.

## 11. Non-functional requirements

- Initial application shell excluding benchmark media: target under 250 KB compressed.
- No React or other large runtime in the MVP.
- Landing page interactive quickly even on the lowest target device.
- No third-party scripts in the timed benchmark route.
- Core test works at 1024×600 and above; usable result viewing down to 320 CSS pixels.
- WCAG 2.2 AA target.
- Keyboard-complete operation.
- No flashing content.
- Test state survives accidental reload when possible.
- Deterministic assets are content-hashed and immutable.
- All thresholds live in external versioned configuration.

## 12. Non-goals

The MVP will not:

- rank CPUs or GPUs globally;
- estimate resale value;
- guarantee compatibility with a specific live website;
- measure antivirus or background processes outside the browser;
- infer device identity from fingerprinting data;
- claim that two different browser engines produce identical scores;
- use cryptocurrency-style proof-of-work or prolonged maximum thermal load.

## 13. Success metrics

### User success

- At least 90% of test starters understand what is being tested before starting.
- At least 80% of completed-test users can correctly explain their grade and top recommended role in an exit study.
- Median time from result display to understanding the recommended use: under 30 seconds.

### Product performance

- At least 85% completion rate on supported browsers.
- Fewer than 3% invalid runs caused by app defects.
- Repeated-run overall-score variation under 7 points on stable reference systems.
- App shell remains usable on the lowest reference device.

### Validity

- Category scores show meaningful correlation with human comfort ratings during calibration.
- Role labels have fewer than 10% severe mismatches in validation studies.

## 14. Risks and mitigations

### Browser implementation affects results

**Mitigation:** report browser context, compare like with like, and avoid cross-browser ranking claims.

### The benchmark becomes heavier than normal use

**Mitigation:** cap pressure duration, calibrate load, and emphasize interaction responsiveness over compute throughput.

### Users treat an experimental score as scientific fact

**Mitigation:** label early profiles Experimental, publish methodology, version scores, and show confidence.

### Network contaminates the test

**Mitigation:** preload and cache all timed assets; never time first-network download as device performance.

### Old hardware crashes mid-test

**Mitigation:** checkpoint module completion, offer safe resume, and treat interruption as a run-quality issue rather than silently assigning zero.

## 15. Release phases

### Phase 1 — Local experimental MVP

Static PWA, six modules, local results, export, transparent Experimental label.

### Phase 2 — Calibration and community testing

Opt-in anonymous submissions, reference-device matrix, result comparison, refined thresholds.

### Phase 3 — Refurbisher mode

Batch device IDs entered by the operator, printable intake sheets, organization-local export/import.

### Phase 4 — Optional native helper

An explicitly installed, open-source companion can expose system-level data such as RAM pressure, battery health, temperature, and storage health. The browser-only experience remains fully functional without it.

---

# Benchmark Methodology

## 1. Measurement philosophy

StillGood is a **usability benchmark**, not a peak-performance benchmark. The primary unit of concern is delay that a person can see or feel.

The benchmark therefore prioritizes:

- interaction latency distributions;
- frame pacing and dropped frames;
- responsiveness while background work is active;
- recovery after pressure;
- successful completion without freezes or reloads;
- repeatability and run confidence.

Raw throughput is supporting evidence, not the headline result.

## 2. What a browser can and cannot measure

### Browser-observable

- custom task durations through high-resolution timing;
- page navigation and resource timings;
- click/keyboard interaction timing where Event Timing is supported;
- main-thread tasks of 50 ms or longer where Long Tasks is supported;
- animation frame cadence using `requestAnimationFrame`;
- long animation frames where supported;
- video dropped-frame counts and frame callbacks;
- Web Worker throughput;
- IndexedDB transaction timing;
- visibility, focus, viewport, and interruption events;
- coarse logical processor availability;
- coarse device-memory hints in some browsers.

### Not reliably browser-observable

- total physical RAM and current system-wide memory pressure;
- swap usage;
- CPU model, clocks, temperature, throttling, or package power;
- disk model, SMART health, and true raw storage throughput;
- battery health and capacity across browsers;
- operating-system boot time;
- suspend/resume reliability outside the page;
- performance of arbitrary third-party applications.

The report must use phrases such as **“observed high interaction delay under pressure”**, not **“your CPU is too slow.”**

## 3. Test conditions

The app should ask the user to:

1. finish operating-system and browser updates;
2. close unrelated heavy applications when seeking a clean comparison;
3. use the computer in its normal power mode;
4. plug in the device for repeatable comparisons, or clearly mark battery mode;
5. keep the benchmark tab visible;
6. avoid resizing the window during a module;
7. allow the device to cool before repeating a failed or unusually poor run.

These are recommendations, not hard requirements. The recorded conditions appear in the result.

## 4. Run structure

### Step A: Asset preparation

- Download all timed assets.
- Verify content hashes.
- Cache assets through the service worker.
- Confirm video codec support.
- Decode a small warm-up image and parse a small warm-up data fixture.

No network transfer is included in module scoring.

### Step B: Capability map

Create a capability record using feature detection, not user-agent assumptions.

Example capabilities:

```json
{
  "performanceObserver": true,
  "eventTiming": true,
  "longTasks": true,
  "longAnimationFrames": false,
  "videoPlaybackQuality": true,
  "requestVideoFrameCallback": true,
  "offscreenCanvas": true,
  "webWorkers": true,
  "indexedDB": true,
  "battery": false
}
```

### Step C: Warm-up

Run one short, unscored pass for:

- common rendering path;
- worker startup;
- fixture parsing;
- IndexedDB open;
- video decoder initialization.

### Step D: Scored modules

Each scored module contains:

- a clear instruction;
- a countdown or readiness cue;
- two or three measured rounds;
- automatic integrity checks;
- a brief optional “How did that feel?” question that is stored separately from the score.

### Step E: Stability analysis

For repeated metrics, compute:

- median;
- 75th percentile;
- 95th percentile;
- worst valid sample;
- coefficient of variation or robust equivalent;
- count and duration of interruptions.

### Step F: Result synthesis

Compute category scores, overall grade, role badges, confidence, and recommendation text from versioned rules.

## 5. Module specifications

## 5.1 Everyday responsiveness

### Scene

A local single-page “work desk” contains:

- inbox list with 200 deterministic messages;
- search box;
- sort control;
- message preview panel;
- compose box;
- small attachment-style image thumbnails;
- task checklist.

### User actions

- click three specified messages;
- filter the inbox using a prompted term;
- sort by sender;
- type a supplied 40–60 character sentence;
- toggle three checklist items.

### Automated actions

- update the DOM after each interaction;
- perform bounded list filtering and layout work;
- introduce one realistic medium-complexity component update, not an artificial busy loop.

### Metrics

- interaction-to-next-paint or best available fallback;
- input delay;
- processing duration;
- presentation delay;
- p75 and p95 interaction latency;
- long-task count and total blocking duration;
- late-frame ratio;
- errors and missed input.

### Integrity rules

- invalidate interaction samples when the page is hidden;
- exclude the first interaction after a long idle interval from the main percentile but retain it diagnostically;
- require at least 10 valid discrete interactions.

## 5.2 Documents and search

### Fixture

A versioned local “community handbook” document:

- approximately 40 pages of equivalent content;
- 35,000–50,000 words;
- 12 tables;
- 20 compressed images;
- headings, footnotes, and callout boxes;
- deterministic search terms with known counts.

### Actions

- open the document view;
- jump to a heading;
- search for a term;
- sort a 500-row table;
- edit a paragraph in a lightweight editor;
- save a local draft;
- reopen the saved draft.

### Metrics

- first meaningful render after opening the module;
- search completion latency;
- table sort and repaint latency;
- editing interaction p95;
- local save transaction latency;
- long-task ratio;
- memory-related symptoms observable inside the app, such as dropped component state or reload.

## 5.3 Multitasking and recovery

### Calibration

Run a 500–800 ms worker calibration task. Estimate work units required for a target pressure window of approximately 8 seconds.

### Pressure workload

Use deterministic, bounded operations with no network:

- text tokenization and inverted-index creation;
- JSON parse/transform/stringify;
- image pixel transformation in `OffscreenCanvas` when supported;
- typed-array sorting and checksum work.

Avoid pure empty loops. Work should resemble browser application computation.

### Worker count

Use:

```text
workerCount = clamp(1, min(4, hardwareConcurrency - 1), availableWorkerLimit)
```

If `hardwareConcurrency` is unavailable, use 1 worker. Never spawn an unbounded number of workers.

### Foreground task

While workers run, the user:

- types a short sentence;
- switches among three internal app panels;
- searches a list;
- presses a response button when it changes state.

### Metrics

- p95 interaction latency under pressure;
- change from baseline latency;
- late-frame ratio;
- audio interruption flag if a simple tone loop is included and permitted;
- worker throughput;
- time from pressure end until five consecutive event-loop probes remain below the recovery threshold;
- errors, page reload, or incomplete worker messages.

### Safety

- pressure window target: 8 seconds;
- hard stop: 15 seconds;
- cancel immediately if UI heartbeat exceeds the emergency threshold for multiple probes;
- allow user cancellation at all times.

## 5.4 Visual smoothness

### Scene

A deterministic dashboard animation with:

- vertical list scroll;
- two transform-based cards;
- a small canvas graph;
- image thumbnails entering and leaving view;
- no flashing and no rapid contrast inversion.

### Measurement

- estimate display cadence during a low-load calibration period;
- use `requestAnimationFrame` timestamps;
- calculate expected frame interval from the median calibration interval;
- define a late frame relative to that interval rather than assuming 60 Hz;
- record p95 frame interval and late-frame percentage;
- use Long Animation Frames where available as diagnostic evidence.

### Accessibility

The module is optional for users who cannot comfortably view motion. Skipping it produces a partial result and does not imply poor device performance.

## 5.5 Video playback

### Assets

Provide short clips with identical visual content in at least:

- 1080p30 H.264/AAC MP4;
- 1080p30 VP9/Opus WebM;
- 720p30 fallback versions.

Select a supported codec, record the codec, and never compare different codecs without displaying the difference.

### Procedure

1. Confirm the asset is cached.
2. Play for at least 20 seconds.
3. Seek twice to deterministic timestamps.
4. Continue playback after each seek.
5. If 1080p is below the usable threshold, repeat at 720p.

### Metrics

- dropped frames / total frames;
- playback start latency after cached load;
- seek recovery time;
- callback lateness where supported;
- playback stalls;
- highest comfortable tier.

### Interpretation

Video results are highly sensitive to codec and hardware-decoding support. Report this explicitly.

## 5.6 Browser storage

### Procedure

- create a temporary IndexedDB database;
- write 16 MiB in 256 KiB records;
- commit in bounded batches;
- read a deterministic random sample;
- delete the database;
- verify cleanup.

Scale down to 8 MiB when storage quota is limited. Do not request persistent storage for the benchmark.

### Metrics

- database open latency;
- median and p95 batch-commit latency;
- aggregate write throughput;
- median random-read latency;
- cleanup success.

### Limitations

This test reflects browser storage, cache, and origin quota behavior. It must not be labeled as an SSD or eMMC benchmark.

## 6. Fallback measurement strategy

### Preferred interaction metric

Use Event Timing through `PerformanceObserver` when available.

### Fallback

For each controlled interaction:

1. record a high-resolution timestamp at event receipt;
2. perform the intended update;
3. schedule `requestAnimationFrame`;
4. schedule a second `requestAnimationFrame` to approximate presentation completion;
5. record elapsed time;
6. mark the metric as fallback-derived.

Fallback results lower confidence but remain useful.

### Long tasks unavailable

Use a recurring event-loop lag probe and frame intervals. Do not synthesize a “long task count” from unrelated metrics.

### Video quality unavailable

Use `requestVideoFrameCallback` if available. Otherwise mark dropped-frame precision unavailable and score using stalls, callback timing, and playback completion with lower confidence.

## 7. Interruption and invalidation rules

Pause or invalidate a module when:

- `document.visibilityState !== "visible"`;
- focus is lost for more than 1 second during an interactive round;
- viewport area changes by more than 15%;
- device orientation changes;
- benchmark asset hash fails;
- a required worker crashes;
- system clock changes do not matter because monotonic performance time is used;
- the user opens print or export during a run.

Offer a clean restart of only the affected module.

## 8. Repeatability

- Run two measured rounds in Quick Check and three in Full Test.
- Use deterministic fixtures and seeded random data.
- Discard warm-up samples.
- Prefer medians for central tendency.
- Use p95 for noticeable worst-case latency.
- Flag high variability rather than averaging it away.
- Preserve raw metrics in exports.

## 9. Ethical load limits

StillGood must not:

- run sustained maximum load for minutes;
- hide resource use;
- continue pressure after the user cancels;
- attempt to infer identity from timing signatures;
- mine cryptocurrency;
- compare users on a public leaderboard by default.

The interface should state when a short pressure test begins and when it ends.

---

# Scoring and Rubric Specification

## 1. Design goals

The score must be:

- understandable;
- stable enough for before-and-after comparison;
- sensitive to freezes and high-percentile delay;
- forgiving of weaknesses that do not affect a chosen role;
- transparent and versioned;
- honest about missing metrics.

## 2. Category weights

| Category | Weight |
|---|---:|
| Everyday responsiveness | 30% |
| Documents and search | 20% |
| Multitasking and recovery | 25% |
| Visual smoothness | 10% |
| Video playback | 10% |
| Browser storage | 5% |

The first three are **core categories**. Video, motion, and storage cannot by themselves condemn a machine that remains good for office or thin-client use.

## 3. Metric normalization

Each metric is converted to a 0–100 score using piecewise linear interpolation between points in `benchmark-profile.v1.json`.

Rules:

1. Lower-is-better metrics list descending quality points, such as latency.
2. Higher-is-better metrics list ascending quality points, such as successful throughput.
3. Values between points are linearly interpolated.
4. Values outside the table are clamped to 0 or 100.
5. Missing optional metrics are omitted and remaining metric weights are normalized within the category.
6. Missing required metrics mark the category incomplete.

## 4. Recommended metric thresholds

These values are initial research-grounded hypotheses and require calibration.

### 4.1 Interaction latency p95

| p95 latency | Score interpretation |
|---:|---|
| ≤100 ms | Excellent / immediate-feeling |
| 200 ms | Good |
| 350 ms | Noticeable but usable |
| 500 ms | Poor boundary |
| 1,000 ms | Frustrating |
| ≥2,000 ms | Severe |

### 4.2 Long-task blocked-time ratio

Blocked time is the sum of long-task duration beyond the first 50 ms, divided by measured module duration.

| Blocked-time ratio | Interpretation |
|---:|---|
| ≤1% | Excellent |
| 3% | Good |
| 8% | Noticeable |
| 15% | Poor |
| ≥35% | Severe |

### 4.3 Late animation frames

A late frame is defined relative to calibrated display cadence.

| Late frames | Interpretation |
|---:|---|
| ≤1% | Excellent |
| 3% | Good |
| 5% | Usable |
| 10% | Poor |
| ≥25% | Severe |

### 4.4 Video dropped frames

| Dropped frames | Interpretation |
|---:|---|
| ≤0.5% | Excellent |
| 1% | Good |
| 3% | Usable |
| 5% | Marginal |
| 10% | Poor |
| ≥25% | Severe |

### 4.5 Recovery time

Time after pressure ends until five consecutive responsiveness probes meet the recovery threshold.

| Recovery time | Interpretation |
|---:|---|
| ≤300 ms | Excellent |
| 1 second | Good |
| 3 seconds | Usable |
| 5 seconds | Poor |
| 10 seconds | Severe |
| ≥20 seconds | Failed recovery |

## 5. Category composition

### Everyday responsiveness

- 60% interaction p95
- 20% interaction p75
- 15% blocked-time ratio
- 5% task completion integrity

### Documents and search

- 30% document open/render
- 25% search latency
- 20% table operation and repaint
- 15% editing interaction p95
- 10% local save/reopen

### Multitasking and recovery

- 45% interaction p95 under pressure
- 20% latency degradation versus baseline
- 15% recovery time
- 10% late-frame ratio
- 10% workload completion integrity

### Visual smoothness

- 60% late-frame ratio
- 25% p95 frame interval relative to refresh cadence
- 15% long-animation-frame evidence or fallback event-loop lag

### Video playback

- 60% dropped-frame ratio
- 15% stalls
- 15% seek recovery
- 10% cached playback start

Apply a tier modifier:

- 1080p comfortable: ×1.00
- 1080p marginal but 720p comfortable: ×0.85
- 720p marginal: ×0.65
- below 720p: ×0.40

### Browser storage

- 50% p95 write-commit latency
- 20% sequential write throughput
- 20% random-read latency
- 10% cleanup/integrity

## 6. Overall score

```text
overall = sum(categoryScore × categoryWeight) / sum(completedCategoryWeights)
```

Round only for display. Preserve at least two decimal places internally.

## 7. Grade bands

| Score | Grade | Label | Meaning |
|---:|:---:|---|---|
| 85–100 | A | Comfortable | Normal basic-computer experience |
| 70–84 | B | Useful | Practical with minor limitations |
| 50–69 | C | Light-duty | Worthwhile with deliberate workload choices |
| 30–49 | D | Single-purpose | Best for one narrow role at a time |
| 0–29 | E | Struggling | General browser workload is not practical |

## 8. Gate rules

Arithmetic averages can hide a serious weakness. Apply these caps after computing the score.

1. Any failed core category caps the result at E.
2. Any core category below 25 caps the result at D.
3. Multitasking below 40 adds **One task at a time** and prevents the Multitasking Ready badge.
4. A skipped category prevents High confidence.
5. A browser crash or inferred interrupted run marks the run Invalid unless all affected modules are repeated.
6. Video or visual smoothness alone cannot cap Web/Email or Office role badges.
7. Storage alone cannot lower the letter grade by more than one band.

## 9. Role badges

### Web and Email Ready

Required:

- responsiveness ≥60;
- documents ≥45;
- multitasking ≥40;
- no core failure.

### Office Ready

Required:

- responsiveness ≥60;
- documents ≥60;
- multitasking ≥50;
- local save/reopen integrity pass.

### Media Ready

Required:

- video ≥60;
- visual smoothness ≥50;
- no playback stalls longer than 1 second after warm-up.

### Multitasking Ready

Required:

- responsiveness ≥65;
- documents ≥60;
- multitasking ≥65;
- recovery ≤3 seconds;
- no severe integrity events.

### Thin-Client Ready

Required:

- responsiveness ≥50;
- visual smoothness ≥40 or skipped;
- reliability/integrity pass;
- multitasking ≥35.

### Single-Purpose Candidate

Award when:

- overall grade is D or E;
- at least one role-relevant category is ≥55;
- no integrity failure prevents safe use.

Examples:

- media player;
- writing terminal;
- kiosk/signage;
- SSH/remote-desktop terminal;
- recipe or workshop station.

## 10. Confidence calculation

### High

- all modules completed;
- direct preferred APIs cover the majority of core metrics;
- no interruption;
- repeated-round variation ≤15%;
- assets verified and cached;
- result is not using a known compatibility exception.

### Medium

- one optional metric uses fallback;
- variation >15% and ≤30%;
- one non-core category skipped;
- minor focus interruption was repeated successfully.

### Low

- multiple fallback metrics;
- variation >30%;
- core category partial;
- unusual viewport or power condition;
- result based on a single valid round.

### Invalid

- hidden/backgrounded test was not repeated;
- required asset failure;
- page reload or worker failure during a core module;
- too few valid interactions;
- user canceled before enough data was collected.

## 11. Human perception check

After each module, optionally ask:

- Comfortable
- Acceptable
- Frustrating
- Could not complete

This answer does **not** alter the v1 objective score. It is shown beside the metric result and, with explicit consent, may be used to calibrate future benchmark profiles.

Reason: subjective comfort is the target outcome, but directly blending a self-rating into the score would reduce repeatability and create circular scoring.

## 12. Recommendation logic

Recommendations are rules based on patterns.

### High baseline latency

> Ordinary interactions were delayed even before pressure was added. A lighter browser profile, fewer extensions, or a lighter desktop environment may help. Compare again after a clean restart.

### Large pressure degradation, good baseline

> The machine feels fine for one task but slows sharply when work overlaps. Treat it as a one-main-task computer and close finished tabs or applications.

### Weak video, otherwise good

> Video playback is the main limitation. Codec support or hardware acceleration may be involved. Compare a current Chromium-based browser and Firefox using the same clip.

### High variability

> Results changed substantially between rounds. Background activity, thermal limits, updates, or power settings may be affecting consistency. Repeat under stable conditions.

### Slow browser storage only

> Local browser saves were slower than the other tasks. Keep free storage available and compare after checking the device’s storage health outside this web app.

Always use **may**, **could**, or **suggests** for causes the browser cannot prove.

## 13. Example result

```text
StillGood Rating: C — Light-duty (63/100)
Confidence: High

Best uses
✓ Web and Email Ready
✓ Office Ready
✓ Thin-Client Ready

Limits
• One main task at a time
• 720p video recommended

Category scores
Responsiveness       72
Documents            68
Multitasking         41
Visual smoothness    57
Video                52
Browser storage      61

Observed pattern
The computer responded well during ordinary work but slowed sharply when background tasks were added.
```

---

# UX and Content Specification

## 1. Experience goal

The app should feel like a friendly diagnostic station, not a gaming benchmark or a punishment test. The user should always know:

- what is happening;
- why the action is relevant;
- how long the current module is likely to feel, without countdown anxiety;
- how to stop safely;
- what the result means in everyday language.

## 2. Voice and tone

- Plainspoken
- Respectful of old equipment
- Neutral, not nostalgic or mocking
- Transparent about uncertainty
- Encouraging without exaggeration

Avoid:

- “potato computer”;
- “obsolete” based only on age;
- “future-proof”;
- “your CPU failed” when only the browser was measured;
- unexplained acronyms on primary screens.

## 3. Information architecture

### Primary routes

- `/` — landing
- `/prepare` — preflight and test selection
- `/test/:module` — active benchmark module
- `/result/:localId` — result report
- `/history` — local run history
- `/methodology` — public methodology
- `/privacy` — privacy and data behavior
- `/about` — product purpose and limitations

Do not load result charts or benchmark assets on the landing route unless needed.

## 4. Landing page

### Hero

**Headline:**  
Is this computer still good for everyday use?

**Supporting line:**  
Run a short, practical test for browsing, documents, video, and multitasking. Get a plain-language result—not just a mystery number.

**Primary action:**  
Test this computer

**Secondary action:**  
See how it works

### Trust strip

- No account
- No ads during testing
- Runs locally
- Open methodology
- About 4 or 8 minutes

### Explainer

**What this measures**  
How responsive this browser feels during common tasks.

**What it cannot see**  
System temperature, total RAM use, battery health, or performance in every application.

## 5. Prepare screen

### Test choices

#### Quick Check

- about 4 minutes;
- responsiveness;
- documents;
- multitasking;
- basic result.

#### Full Test

- about 8 minutes;
- all Quick Check modules;
- motion smoothness;
- video;
- browser storage;
- complete role badges.

### Conditions

Ask with simple controls:

**Power**
- Plugged in
- On battery
- I’m not sure

**Current setup**
- Normal everyday setup
- Clean comparison run

A “clean comparison run” means the user intentionally closed unrelated applications. It does not alter the score; it is metadata.

### Preflight outcomes

Use three states:

- Ready
- Ready with limitations
- Fix before testing

Examples:

> **Ready with limitations**  
> This browser cannot report exact dropped video frames. Video will use a lower-confidence fallback.

> **Fix before testing**  
> The benchmark tab is not visible. Return to this tab to continue.

## 6. Active test shell

Persistent elements:

- product name;
- module name;
- overall progress by module, not a continuously ticking timer;
- Stop test button;
- concise instruction;
- accessibility control to reduce or skip motion before a motion module;
- no navigation menu that invites accidental exit.

### Stop behavior

On Stop:

> Stop the test? Completed modules will be saved, but the result will be partial.

Buttons:

- Continue test
- Stop and view partial result

## 7. Module content

## 7.1 Everyday response

**Intro:**  
You’ll use a small practice inbox. We’re measuring how quickly the screen responds—not how quickly you type.

Prompts:

- Open the message from River Street Library.
- Search for `repair fair`.
- Sort the inbox by sender.
- Type: `The refurbished laptops are ready for pickup.`
- Check the three completed tasks.

Never grade typing speed or spelling. Detect the expected supplied string only to know when the interaction is complete.

## 7.2 Documents

**Intro:**  
This checks reading, searching, sorting, editing, and saving a document-like workload.

Prompts:

- Find the section called Device Intake.
- Search for `battery inspection`.
- Sort the inventory table by year.
- Add the sentence shown below.
- Save the draft, then reopen it.

## 7.3 Multitasking

**Intro:**  
For a few seconds, the app will do background work while you keep using it. This shows whether the computer stays responsive when tasks overlap.

**Before pressure:**  
Background work starts when you press Begin. You can stop at any time.

**During pressure:**  
Keep typing and switching panels normally. The test ends automatically.

**Emergency state:**  
This device is having trouble staying responsive. The pressure test was stopped early.

Do not display a shaming failure animation.

## 7.4 Smoothness

**Intro:**  
This short scene checks whether ordinary motion and scrolling stay smooth.

Offer:

- Run motion test
- Skip motion test

If `prefers-reduced-motion` is active:

> Your system requests reduced motion. This test is optional and will not start unless you choose it.

## 7.5 Video

**Intro:**  
This plays a short local test clip. Internet speed is not included once the clip is ready.

Display the tested tier and codec in details, not as the main focus.

## 7.6 Browser storage

**Intro:**  
This briefly writes and reads temporary data inside the browser. Test data is deleted afterward.

Buttons:

- Run storage test
- Skip

## 8. Result page hierarchy

### First screenful

1. Grade and label
2. One-sentence interpretation
3. Best-use role badges
4. Main limitation
5. Confidence

Example:

> **B — Useful**  
> This computer is comfortable for everyday web and document work, but heavy multitasking is its main limit.

### Category cards

Each card includes:

- plain-language category;
- 0–100 score;
- Comfortable / Usable / Limited / Struggling label;
- one observable metric summary;
- Details disclosure.

Example:

> **Everyday response — 74, Useful**  
> Most interactions appeared within 220 ms. A few slower moments reached 410 ms.

### “Good fit for” section

Show role badges as positive recommendations.

### “Use with care” section

Show concrete limitations:

- Keep to one main task
- Prefer 720p video
- Large document searches may pause
- Results varied between rounds

### “Try next” section

Limit to the three most relevant suggestions.

### Technical details

Collapsed by default:

- raw metrics;
- browser context;
- benchmark version;
- power state;
- viewport;
- supported APIs;
- interruption log;
- category calculations.

## 9. Grade content

### A — Comfortable

> This device handles the tested everyday workload with little noticeable waiting.

### B — Useful

> This device remains practical for everyday use. You may notice limits during heavier overlap or media work.

### C — Light-duty

> This device is worthwhile for lighter tasks when you keep the workload focused.

### D — Single-purpose

> This device works best when assigned one clear job at a time.

### E — Struggling

> The tested browser workload caused delays that would interfere with ordinary use. A narrower offline role may still be possible.

## 10. Comparison view

Allow two local results to be compared only when:

- benchmark profile versions match, or a warning is shown;
- browser family is the same, or a warning is shown;
- tested power conditions are visible.

Display:

- overall score difference;
- category differences;
- confidence changes;
- browser or setup changes;
- “meaningful change” only when difference exceeds repeat-run tolerance.

Do not use celebratory language for differences smaller than expected variance.

## 11. Printable and copyable summary

### Copyable format

```text
StillGood v1 — B (Useful), 76/100
Web and Email Ready · Office Ready · Thin-Client Ready
Main limit: heavier multitasking
Video: comfortable at 720p
Confidence: High
Browser: Firefox, Linux
```

### Printed report

One page preferred. Include a QR code only in a later hosted-sharing feature; never embed a tracking URL by default.

## 12. Error language

### Asset failed

> A test file did not load correctly, so this module was not scored. Check the connection once, then try the module again.

### Tab hidden

> The browser pauses some work in background tabs. This round was stopped so the result stays fair.

### High variability

> The rounds did not agree closely enough for a confident result. Background activity or changing power conditions may be involved.

### Unsupported browser

> This browser can run a limited version of the test, but some measurements will use fallbacks. Your result will show lower confidence.

---

# Technical Architecture

## 1. Architecture decision

Build the MVP as a **static, local-first progressive web app** using **Vanilla TypeScript, semantic HTML, and CSS**, bundled with Vite or an equivalently lightweight tool.

Do not use React, Next.js, or a server-rendered application framework for the MVP. The benchmark should not spend a meaningful portion of an old computer’s capacity running its own UI framework.

## 2. High-level system

```text
Browser
├─ App shell and router
├─ Benchmark controller
│  ├─ Capability detection
│  ├─ Module lifecycle
│  ├─ Integrity monitor
│  ├─ Metric collectors
│  ├─ Scoring engine
│  └─ Recommendation engine
├─ Test modules
│  ├─ Everyday response
│  ├─ Documents
│  ├─ Multitasking
│  ├─ Smoothness
│  ├─ Video
│  └─ Browser storage
├─ Workers
│  ├─ text-index.worker.ts
│  ├─ data-transform.worker.ts
│  └─ image-transform.worker.ts
├─ Local persistence
│  ├─ IndexedDB results
│  └─ session checkpoint
└─ Service worker
   ├─ app-shell cache
   └─ versioned benchmark assets
```

No backend is required for MVP.

## 3. Technology choices

### Required

- TypeScript with strict mode
- Vite
- Native ES modules
- Custom lightweight component functions or Web Components
- CSS custom properties
- IndexedDB through a small internal wrapper
- Service worker written in project code
- Vitest for unit tests
- Playwright for end-to-end tests
- ESLint and Prettier or equivalent

### Avoid in MVP

- large UI frameworks;
- charting libraries;
- animation libraries;
- runtime schema libraries unless bundle impact is justified;
- analytics SDKs;
- third-party scripts on benchmark routes;
- WASM merely to inflate benchmark difficulty.

Use SVG and semantic HTML for result charts.

## 4. Core types

```ts
export type BenchmarkGrade = "A" | "B" | "C" | "D" | "E";
export type Confidence = "high" | "medium" | "low" | "invalid";

export interface BenchmarkContext {
  appVersion: string;
  profileVersion: string;
  fixtureVersion: string;
  startedAt: string;
  browserFamily?: string;
  browserVersion?: string;
  platformHint?: string;
  viewport: { width: number; height: number; dpr: number };
  powerState: "plugged" | "battery" | "unknown";
  runMode: "quick" | "full";
  setupMode: "normal" | "clean-comparison";
  capabilities: CapabilityMap;
}

export interface MetricSample {
  metricId: string;
  value: number;
  unit: "ms" | "ratio" | "fps" | "opsPerSecond" | "MiBPerSecond" | "count";
  source: "preferred-api" | "fallback" | "derived";
  valid: boolean;
  invalidReason?: string;
  timestamp: number;
  round: number;
}

export interface ModuleResult {
  moduleId: string;
  status: "complete" | "partial" | "failed" | "skipped";
  score?: number;
  samples: MetricSample[];
  integrityEvents: IntegrityEvent[];
  userPerception?: "comfortable" | "acceptable" | "frustrating" | "unable";
  startedAt: string;
  completedAt?: string;
}

export interface BenchmarkResult {
  id: string;
  context: BenchmarkContext;
  modules: ModuleResult[];
  categoryScores: Record<string, number | null>;
  overallScore: number | null;
  grade: BenchmarkGrade | null;
  confidence: Confidence;
  roles: string[];
  limitations: string[];
  recommendations: Recommendation[];
  rawProfileSnapshot: unknown;
}
```

## 5. Benchmark controller

The controller owns the state machine:

```text
idle
→ preparing-assets
→ preflight
→ warmup
→ module-ready
→ module-running
→ module-validating
→ module-complete
→ result-computing
→ complete
```

Side states:

- paused-interruption;
- canceled;
- partial;
- invalid;
- recoverable-error.

Only the controller can start pressure workers or commit scored samples.

## 6. Metric collectors

Create small collectors with a shared interface:

```ts
interface MetricCollector {
  id: string;
  supported(): boolean;
  start(context: CollectorContext): void | Promise<void>;
  stop(): MetricSample[] | Promise<MetricSample[]>;
  reset(): void;
}
```

Collectors:

- `EventTimingCollector`
- `InteractionFallbackCollector`
- `LongTaskCollector`
- `LongAnimationFrameCollector`
- `FrameCadenceCollector`
- `EventLoopLagCollector`
- `VideoQualityCollector`
- `NavigationTimingCollector`
- `IndexedDbTimingCollector`
- `IntegrityCollector`

Never put scoring logic inside collectors.

## 7. Interaction measurement

### Preferred path

Use `PerformanceObserver` for supported Event Timing entries. Correlate events to benchmark actions using action IDs and timestamps.

### Fallback path

- attach a capture-phase event listener;
- record `performance.now()`;
- execute action;
- resolve after two animation frames;
- record total presentation approximation;
- tag as fallback.

The fallback should not claim to be exact INP.

## 8. Frame measurement

1. Gather at least 120 low-load `requestAnimationFrame` samples.
2. Calculate median frame interval.
3. Remove obvious pause/outlier intervals from refresh-rate calibration.
4. During the module, compare each interval with the calibrated interval.
5. Record ratios rather than assuming 16.67 ms.
6. Detect hidden-tab pause through visibility events and invalidate the round.

## 9. Worker pressure design

Workers must receive a deterministic seed and work-unit count.

Example message:

```ts
interface WorkerRunRequest {
  runId: string;
  task: "text-index" | "data-transform" | "image-transform";
  seed: number;
  workUnits: number;
  deadlineMs: number;
}
```

Workers send periodic heartbeats and support cancellation.

The main thread maintains an emergency heartbeat. If heartbeat delay exceeds the configured threshold multiple times, cancel pressure and classify the module as early-stopped rather than freezing the page intentionally.

## 10. Scoring engine

Inputs:

- immutable profile configuration;
- normalized module metrics;
- module status;
- capability map;
- integrity events.

Outputs:

- metric scores;
- category scores;
- overall score;
- grade after gates;
- confidence;
- role badges;
- recommendation rule IDs.

Requirements:

- pure functions where possible;
- deterministic;
- exhaustive unit tests at thresholds;
- include profile snapshot in export;
- no hidden server-side adjustments.

## 11. Configuration

Load `benchmark-profile.v1.json` as a versioned static asset. Validate manually with a small internal validator.

Configuration includes:

- module weights;
- metric weights;
- normalization points;
- grade bands;
- gate rules;
- role requirements;
- confidence limits;
- safety timeouts;
- minimum sample counts.

Do not allow remote runtime changes to the active profile without a new version.

## 12. Persistence

### IndexedDB stores

- `results`
- `moduleCheckpoints`
- `assetMetadata`
- `userPreferences`

### Session recovery

Before each module:

- save current run ID and expected module;
- mark module `running`;
- on successful completion, mark complete;
- on startup, detect an unfinished module and explain that the previous run was interrupted.

Do not silently convert an interruption into a zero.

## 13. PWA and caching

Cache strategy:

- app shell: cache-first with version invalidation;
- benchmark fixtures: cache-first, immutable content hash;
- methodology pages: stale-while-revalidate;
- no third-party benchmark assets;
- verify required assets before a timed module.

The app should display:

> Test files ready. Network speed will not be included.

## 14. Export format

JSON export must contain:

- schema version;
- context;
- capability map;
- raw valid and invalid samples;
- module results;
- score calculations;
- profile snapshot;
- user perception answers;
- manual checklist, if completed.

Do not export stable browser identifiers or local history IDs that could be used for tracking across sites.

## 15. Optional anonymous aggregation — future

Not part of MVP. If added:

- explicit opt-in after results;
- separate consent for raw metrics and free-text notes;
- no IP retention beyond standard security logging;
- coarse device information only;
- public deletion and retention policy;
- server accepts only known benchmark versions;
- abuse and bot filtering without invasive fingerprinting.

## 16. Performance budget

### App shell

- JavaScript compressed: target ≤150 KB
- CSS compressed: target ≤35 KB
- HTML compressed: target ≤20 KB
- no benchmark media preloaded on landing

### Runtime

- no idle animation on benchmark routes;
- no polling faster than needed outside measured modules;
- result page charts rendered once;
- use content visibility and incremental rendering for long fixtures;
- do not use virtualized lists in ways that make the test meaningless unless the fixture specifies them.

## 17. Browser support

### Tier 1

- current Chromium-based browsers;
- current Firefox.

### Tier 2

- current Safari with fallbacks and lower confidence where required APIs are unavailable.

### Unsupported

Browsers without ES module, IndexedDB, Worker, or high-resolution timing support receive an explanation and may use a manual-only checklist.

## 18. Deployment

MVP can deploy to:

- GitHub Pages;
- Cloudflare Pages;
- Netlify;
- any static HTTPS host.

Use immutable hashed assets and a clear version in the footer and result export.

---

# Privacy, Accessibility, and Benchmark Integrity

## 1. Privacy requirements

### Default behavior

- No account.
- No result upload.
- No advertising scripts.
- No cross-site trackers.
- No third-party fonts.
- No fingerprinting library.
- Results remain in local browser storage.

### Data minimization

Collect only what is required to interpret the run:

- browser family and broad version when available;
- broad platform hint;
- viewport and pixel ratio;
- supplied power condition;
- supported capability flags;
- benchmark metrics;
- benchmark version.

Do not collect:

- installed fonts;
- canvas fingerprint hashes;
- audio fingerprints;
- full plugin lists;
- serial numbers;
- local file paths;
- device names;
- precise location;
- persistent cross-site identifiers.

### Coarse hardware hints

`hardwareConcurrency` and `deviceMemory` may be recorded locally as coarse context if available. They must not influence the core grade in v1 and must not be uploaded without explicit consent.

### Analytics

For MVP, prefer no analytics. If basic operational analytics are later added:

- exclude benchmark routes from session replay;
- never capture typed benchmark text;
- do not send raw timing samples by default;
- publish the exact event list;
- provide a no-analytics build option.

## 2. Accessibility target

Target WCAG 2.2 AA for all ordinary interface screens.

### Required

- complete keyboard navigation;
- visible focus indicators;
- semantic landmarks and headings;
- form labels and error associations;
- no color-only meaning;
- sufficient contrast;
- zoom to 200% without loss of core functionality;
- understandable status announcements through an ARIA live region;
- no flashing content;
- large hit targets where practical;
- result charts accompanied by text values.

### Motion

- Respect `prefers-reduced-motion` everywhere except an explicitly chosen motion benchmark.
- Do not autoplay the smoothness module for reduced-motion users.
- Allow skipping the module.
- Never use rapid zoom, parallax, or flashing patterns.

### Cognitive load

- one instruction at a time;
- examples directly beside tasks;
- no countdown that disappears before the user is ready;
- progress by completed modules;
- plain-language labels before technical details.

### Input differences

The benchmark must support mouse, trackpad, touch, and keyboard. Do not score the user’s pointing accuracy or typing speed.

## 3. Benchmark integrity

### Foreground requirement

Browsers commonly throttle animation and work in background tabs. Monitor:

- `visibilitychange`;
- window focus/blur;
- large viewport changes;
- page lifecycle events.

Stop the active round when integrity is compromised.

### Asset integrity

- bundle all workloads;
- use content hashes;
- cache before timing;
- verify fixture version;
- do not time server response or CDN behavior as device performance.

### Extension and browser effects

Extensions, privacy tools, and browser configuration are part of the actual browsing environment. Do not attempt to evade or disable them.

Result text should say:

> This score reflects this browser and its current configuration.

For controlled comparisons, advise users to keep browser, profile, extensions, and power state consistent.

### Thermal and background variability

The browser cannot prove thermal throttling or operating-system background pressure. Detect high round-to-round variability and report it neutrally.

### Cheating and leaderboards

The MVP has no competitive leaderboard. This removes most incentive to manipulate results. Future comparisons must retain raw metrics and benchmark version.

## 4. Safety requirements

- Every pressure workload has a hard deadline.
- Every worker supports cancellation.
- UI heartbeat stops pressure early when responsiveness becomes severe.
- User can stop at any time.
- No module sustains maximum load for longer than 15 seconds.
- Storage writes are bounded and temporary.
- App does not request persistent storage for benchmark data.
- Warn users separately about swollen or damaged batteries in the manual checklist.

## 5. Manual hardware checklist separation

The optional manual checklist can produce the following statuses:

- Hardware basics passed
- Mobility limited
- Plug-in use recommended
- Repair recommended
- Battery safety warning

It does not alter the browser performance grade.

A battery-safety warning should state:

> Stop using or charging a swollen, leaking, unusually hot, or physically damaged battery and seek qualified service.

Do not ask users to puncture, compress, or remove a swollen battery unless they are qualified to do so.

## 6. Transparency requirements

Publish in-app:

- benchmark methodology;
- category weights;
- current thresholds;
- limitations;
- source code license;
- benchmark and fixture version;
- changelog describing scoring changes.

A score from a new profile version must not be presented as directly comparable to an old profile without a migration note.

---

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

---

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

---

# Codex Master Prompt

Use the following prompt after placing this specification pack in the repository.

---

You are building **StillGood**, a browser-based second-life computer usability benchmark.

Read every file in `docs/` in numeric order and treat them as the product source of truth. Also read `benchmark-profile.v1.json`.

## Immediate assignment

Implement Milestones 0–3 from `08_CODEX_IMPLEMENTATION_PLAN.md`:

1. repository foundation;
2. benchmark lifecycle and local storage;
3. pure scoring engine;
4. a complete Everyday Responsiveness vertical slice.

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
- run the simulated inbox responsiveness module;
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
- complete keyboard navigation through the prototype.

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

---

# Research Basis and Standards Notes

## 1. Why this is not simply another Speedometer

Speedometer is designed to measure web-application responsiveness by timing simulated interactions across representative web workloads. That makes it an important reference, but StillGood has a different output goal: translate interaction behavior, motion, media, pressure, and recovery into role suitability for an individual device.

Reference:

- BrowserBench, **Speedometer 3 About**

## 2. Interaction thresholds

Interaction to Next Paint is a field responsiveness metric. Current web guidance uses:

- 200 ms or less as good;
- greater than 500 ms as poor.

StillGood uses these as anchors, while adding stricter excellent thresholds and slower severe thresholds for a device-level usability rubric.

References:

- web.dev, **Interaction to Next Paint (INP)**
- web.dev, **How the Core Web Vitals metrics thresholds were defined**

## 3. Long tasks

The Long Tasks API identifies tasks that monopolize the browser’s UI thread for 50 ms or more. Long tasks matter because they can delay input handling and visual updates.

References:

- W3C, **Long Tasks API**
- MDN, **PerformanceLongTaskTiming**

## 4. Custom task timing

The User Timing API provides high-resolution custom marks and measures for application-defined operations. StillGood uses the same principle for deterministic benchmark actions.

References:

- MDN, **User timing**
- W3C, **Performance Timeline**

## 5. Navigation and resources

Navigation Timing and Resource Timing expose detailed page and asset timing. StillGood uses them for preparation diagnostics, but excludes network transfer from the device score by caching assets before measured modules.

References:

- W3C, **Navigation Timing Level 2**
- W3C, **Resource Timing**

## 6. Animation and visibility

`requestAnimationFrame` generally follows display refresh cadence and is paused or throttled in hidden tabs. This is why the benchmark calibrates against observed cadence and invalidates backgrounded rounds.

Reference:

- MDN, **Window: requestAnimationFrame()**

Long Animation Frames can provide additional diagnostic information about frames that block rendering and interaction, but support must be feature-detected.

Reference:

- MDN, **Long animation frame timing**

## 7. Background pressure

Web Workers run work away from the main browser execution thread and make it possible to apply bounded background pressure while measuring foreground responsiveness.

Reference:

- MDN, **Web Workers API**

OffscreenCanvas can move some canvas work into workers, but support varies by feature and must not be required.

Reference:

- MDN, **OffscreenCanvas**

## 8. Video quality

`getVideoPlaybackQuality()` exposes total and dropped video-frame counts in supporting browsers. `requestVideoFrameCallback()` can provide per-video-frame callback timing.

References:

- MDN, **VideoPlaybackQuality: droppedVideoFrames**
- MDN, **HTMLVideoElement: requestVideoFrameCallback()**

## 9. Hardware hints are limited

`navigator.hardwareConcurrency` reports logical processors available to the browser, which may be less than the physical system total. `navigator.deviceMemory`, where available, is coarse and intentionally reduced for privacy.

References:

- MDN, **Navigator: hardwareConcurrency**
- MDN, **Navigator: deviceMemory**

These values must not be treated as exact inventory data or core scoring inputs.

## 10. Storage estimates are origin-scoped

`navigator.storage.estimate()` reports an estimate of usage and quota available to the origin. It is not a raw disk-capacity or free-space API. IndexedDB timing reflects the browser storage path and is therefore a low-weight category.

References:

- MDN, **StorageManager: estimate()**
- MDN, **Storage API**

## 11. Battery information is not portable

The Battery Status API has limited availability and requires a secure context in supporting browsers. It cannot be the basis of a cross-browser battery-health score.

Reference:

- MDN, **Battery Status API**

## 12. Research interpretation

The initial thresholds in this pack are a transparent starting hypothesis. Only the 200 ms and 500 ms interaction anchors and the 50 ms long-task definition have direct standards/guidance grounding. Role thresholds, grade weights, dropped-frame bands, and recovery bands must be validated on physical devices with human comfort ratings before the benchmark is presented as established rather than Experimental.

---

# ADR-001: Browser-First Delivery

**Status:** Accepted for MVP  
**Date:** 2026-07-19

## Context

A native application could inspect more of the operating system and hardware. It could potentially measure boot integration, system memory pressure, temperatures, battery capacity, storage health, and application launch behavior.

However, the product’s intended users are evaluating old and varied devices. Requiring installation, administrator access, platform-specific packages, or trust in an unsigned utility would sharply reduce reach. The product must be available where users already are: in the browser.

## Decision

Build the first release as a browser-based progressive web app.

The app will measure browser-observable experience and disclose its limits. It will not infer missing system data.

## Consequences

### Positive

- one URL works across operating systems;
- no installation barrier;
- simple sharing among refurbishers and buyers;
- static hosting is inexpensive;
- deterministic assets can work offline after first load;
- the tested browser is itself a major part of everyday computer use;
- open methodology is easy to inspect.

### Negative

- cannot reliably inspect total RAM, swap, thermals, SMART, or battery health;
- results are browser-specific;
- browser throttling requires strict foreground integrity checks;
- some useful APIs vary by engine;
- cannot directly test native application launch or system suspend.

## Mitigations

- report observed symptoms rather than diagnoses;
- attach browser and benchmark versions to every result;
- use capability detection and confidence levels;
- keep manual hardware checks separate;
- consider an optional open-source native helper in a later phase;
- preserve the browser-only grade as the common baseline even if a helper exists.

## Rejected alternatives

### Native-only application

Rejected for the MVP because distribution and trust barriers conflict with broad second-life-device access.

### Electron application

Rejected because its runtime overhead would distort the very low-end devices being evaluated.

### Browser extension

Rejected because installation friction remains high and extension permissions create trust concerns.

### Live third-party website workflow

Rejected because changing sites, ads, network conditions, and cross-origin restrictions would undermine repeatability.

---

# Machine-readable benchmark profile

```json
{
  "$schema": "https://example.invalid/stillgood/benchmark-profile.schema.json",
  "profileVersion": "1.0.0-experimental",
  "fixtureVersion": "1.0.0",
  "status": "experimental",
  "categoryWeights": {
    "responsiveness": 0.30,
    "documents": 0.20,
    "multitasking": 0.25,
    "smoothness": 0.10,
    "video": 0.10,
    "browserStorage": 0.05
  },
  "gradeBands": [
    { "grade": "A", "label": "Comfortable", "min": 85 },
    { "grade": "B", "label": "Useful", "min": 70 },
    { "grade": "C", "label": "Light-duty", "min": 50 },
    { "grade": "D", "label": "Single-purpose", "min": 30 },
    { "grade": "E", "label": "Struggling", "min": 0 }
  ],
  "normalizers": {
    "interactionP95Ms": {
      "direction": "lowerIsBetter",
      "points": [
        { "value": 100, "score": 100 },
        { "value": 200, "score": 85 },
        { "value": 350, "score": 65 },
        { "value": 500, "score": 40 },
        { "value": 1000, "score": 15 },
        { "value": 2000, "score": 0 }
      ]
    },
    "interactionP75Ms": {
      "direction": "lowerIsBetter",
      "points": [
        { "value": 75, "score": 100 },
        { "value": 150, "score": 85 },
        { "value": 250, "score": 65 },
        { "value": 400, "score": 40 },
        { "value": 800, "score": 10 },
        { "value": 1500, "score": 0 }
      ]
    },
    "blockedTimeRatio": {
      "direction": "lowerIsBetter",
      "points": [
        { "value": 0.01, "score": 100 },
        { "value": 0.03, "score": 85 },
        { "value": 0.08, "score": 65 },
        { "value": 0.15, "score": 40 },
        { "value": 0.35, "score": 0 }
      ]
    },
    "lateFrameRatio": {
      "direction": "lowerIsBetter",
      "points": [
        { "value": 0.01, "score": 100 },
        { "value": 0.03, "score": 85 },
        { "value": 0.05, "score": 65 },
        { "value": 0.10, "score": 40 },
        { "value": 0.25, "score": 0 }
      ]
    },
    "videoDroppedFrameRatio": {
      "direction": "lowerIsBetter",
      "points": [
        { "value": 0.005, "score": 100 },
        { "value": 0.01, "score": 90 },
        { "value": 0.03, "score": 70 },
        { "value": 0.05, "score": 50 },
        { "value": 0.10, "score": 25 },
        { "value": 0.25, "score": 0 }
      ]
    },
    "recoveryMs": {
      "direction": "lowerIsBetter",
      "points": [
        { "value": 300, "score": 100 },
        { "value": 1000, "score": 85 },
        { "value": 3000, "score": 65 },
        { "value": 5000, "score": 40 },
        { "value": 10000, "score": 15 },
        { "value": 20000, "score": 0 }
      ]
    }
  },
  "categoryMetricWeights": {
    "responsiveness": {
      "interactionP95Ms": 0.60,
      "interactionP75Ms": 0.20,
      "blockedTimeRatio": 0.15,
      "taskIntegrity": 0.05
    },
    "documents": {
      "openRender": 0.30,
      "search": 0.25,
      "tableOperation": 0.20,
      "editingInteraction": 0.15,
      "saveReopen": 0.10
    },
    "multitasking": {
      "pressureInteraction": 0.45,
      "baselineDegradation": 0.20,
      "recovery": 0.15,
      "lateFrames": 0.10,
      "taskIntegrity": 0.10
    },
    "smoothness": {
      "lateFrames": 0.60,
      "frameP95Ratio": 0.25,
      "blockingEvidence": 0.15
    },
    "video": {
      "droppedFrames": 0.60,
      "stalls": 0.15,
      "seekRecovery": 0.15,
      "cachedStart": 0.10
    },
    "browserStorage": {
      "writeCommitP95": 0.50,
      "writeThroughput": 0.20,
      "randomRead": 0.20,
      "cleanupIntegrity": 0.10
    }
  },
  "videoTierModifiers": {
    "1080p-comfortable": 1.0,
    "720p-comfortable": 0.85,
    "720p-marginal": 0.65,
    "below-720p": 0.40
  },
  "gateRules": {
    "failedCoreCategoryGrade": "E",
    "coreCategoryBelow": 25,
    "coreCategoryGradeCap": "D",
    "multitaskingOneTaskThreshold": 40,
    "skippedCategoryPreventsHighConfidence": true,
    "storageMaximumGradeBandImpact": 1
  },
  "confidence": {
    "highMaxVariationRatio": 0.15,
    "mediumMaxVariationRatio": 0.30,
    "minimumValidInteractions": 10,
    "quickRounds": 2,
    "fullRounds": 3
  },
  "safety": {
    "pressureTargetMs": 8000,
    "pressureHardStopMs": 15000,
    "emergencyHeartbeatMs": 2000,
    "focusLossGraceMs": 1000,
    "maxViewportAreaChangeRatio": 0.15,
    "storageDefaultMiB": 16,
    "storageMinimumMiB": 8
  },
  "roleRules": {
    "webEmailReady": {
      "responsiveness": 60,
      "documents": 45,
      "multitasking": 40
    },
    "officeReady": {
      "responsiveness": 60,
      "documents": 60,
      "multitasking": 50,
      "requiresSaveIntegrity": true
    },
    "mediaReady": {
      "video": 60,
      "smoothness": 50,
      "maxWarmStallMs": 1000
    },
    "multitaskingReady": {
      "responsiveness": 65,
      "documents": 60,
      "multitasking": 65,
      "maxRecoveryMs": 3000
    },
    "thinClientReady": {
      "responsiveness": 50,
      "multitasking": 35,
      "smoothnessOrSkipped": 40
    }
  }
}
```
