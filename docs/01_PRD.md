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
