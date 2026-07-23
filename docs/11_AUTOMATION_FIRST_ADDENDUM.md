# Automation-First Benchmark Addendum

**Addendum version:** 1.0-draft  
**Applies to:** StillGood specification pack v1.0-draft  
**Decision date:** 2026-07-23  
**Status:** Authoritative for new implementation work

## 1. Purpose and precedence

StillGood is a one-click, automated usability benchmark. The user starts a test, leaves the tab visible, and does not interact with the computer until the run finishes.

This addendum supersedes every requirement in the base specification that asks the user to type, click, search, sort, switch panels, rate a module during the run, or otherwise provide timed interaction. The separate optional hardware and safety checklist remains manual because a browser cannot inspect those conditions.

When this addendum conflicts with another document in the pack, use this addendum. Requirements that do not conflict remain in force, including privacy, accessibility, integrity, browser-observable language, versioned scoring, deterministic local fixtures, and bounded workloads.

## 2. Revised product promise

> StillGood automatically recreates ordinary computer work, measures where responsiveness begins to break down, and explains which jobs the device can still perform comfortably.

The product must not lead with a composite benchmark number. It may calculate a grade and score for comparison, but the primary output is a practical capability report supported by measured data.

## 3. Revised user journey

1. The user opens StillGood and sees what is measured, what is not measured, expected duration, and the instruction to leave the tab visible.
2. The user chooses Quick Check or Full Test and optionally records power/setup conditions.
3. A single user gesture starts preflight and unlocks media playback where browser policy requires it.
4. StillGood loads and verifies all assets, detects measurement capabilities, establishes display cadence, and runs an unscored warm-up.
5. The benchmark automatically performs visible, deterministic actions in simulated applications.
6. Workloads advance through baseline, light, moderate, and heavy stages only while safety and responsiveness rules allow.
7. A module stops escalating when the next stage would no longer add useful evidence or when emergency delay thresholds are crossed.
8. StillGood measures recovery, validates the run, and produces the capability report.
9. The user may inspect technical details, export JSON, print, or compare with a compatible local result.

The only required action during a measured run is no action.

## 4. Automated action driver

Every module must expose a deterministic action script. Each action has:

- a stable action ID;
- a fixture version;
- a scheduled start;
- a visible state change;
- a completion condition;
- a timeout;
- one or more measurement marks;
- an integrity outcome.

The driver dispatches synthetic application actions directly through product-owned APIs. It must not use untrusted page automation, remote websites, or OS-level input injection.

Synthetic DOM events are not treated as real Event Timing input samples. Automated actions use explicit action-start marks and presentation completion measured through two animation frames, supplemented by Long Tasks, Long Animation Frames, event-loop lag, and frame cadence where available.

## 5. Automated module behavior

### 5.1 Everyday web applications

A visible inbox/composer simulation automatically opens conversations, searches a deterministic message set, sorts rows, expands threads, applies labels, types a supplied draft through scheduled text updates, and switches folders.

Report:

- typical action-to-presentation delay;
- p75 and p95 delay;
- repeated worst delay;
- blocked time and long-task evidence;
- completion integrity.

Typing animation is a workload generator, not a typing-speed test.

### 5.2 Documents and tables

A visible document workspace automatically opens a versioned fixture, jumps between headings, searches text, edits and formats a paragraph, inserts and sorts table rows, recalculates bounded formulas, saves a draft, and reopens it.

### 5.3 Browsing workload

Local article, shopping-grid, search-results, map-like, comments, and dashboard fixtures are mounted as internal panels. StillGood scrolls, filters, expands images, opens panels, and switches among them. This represents reproducible browser work; it does not claim to reproduce literal multi-tab memory behavior.

### 5.4 Visual smoothness

A deterministic sequence scrolls content and animates transform-based panels, image grids, and a small canvas scene. Timing is relative to detected display cadence. Reduced-motion preferences change presentation, not workload validity: motion may be represented with discrete frame-stepped transitions and the result must disclose the mode.

### 5.5 Video

Cached local clips play automatically using the start gesture obtained before the run. Test supported tiers from low to high and stop after a tier is clearly uncomfortable. Include a light overlapping application workload. Report the highest comfortable and highest usable tier, codec, dropped frames or fallback evidence, stalls, and seek recovery.

### 5.6 Multitasking and recovery

This is the centerpiece. Foreground application actions continue while deterministic worker, rendering, media, and browser-storage workloads are introduced in stages. Each stage has a bounded duration and fixed work definition.

### 5.7 Browser storage

IndexedDB operations run automatically, remain bounded, clean up after success or cancellation, and are labeled browser storage responsiveness rather than physical-drive speed.

## 6. Adaptive workload ladder

The workload ladder is:

| Stage | Practical interpretation |
|---|---|
| Baseline | One simple active task |
| Light | Email, an article, and a basic document |
| Moderate | Several active web tasks with background work |
| Heavy | Demanding web multitasking |
| Stress | Optional diagnostic comparison; never required for a usability grade |

The benchmark identifies the highest stage that remains:

- **Comfortable**
- **Usable**
- **Frustrating**
- **Unable to complete**

Stage definitions are fixed and versioned. Device calibration may scale the number of work units used to reach a fixed-duration stage, but it must not silently turn the stage into a different workload. Report both the logical stage and calibrated work units.

## 7. Early stopping and safety

Escalation stops when any of the following occurs:

- emergency heartbeat delay is exceeded on repeated probes;
- foreground action p95 exceeds the severe threshold;
- action backlog grows across consecutive sampling windows;
- video/audio continuity fails repeatedly;
- a required worker fails;
- the tab is hidden or materially resized;
- the user cancels.

An early-stopped stage is useful evidence, not an application error. The result says that the device crossed its practical limit at that stage. The driver must yield regularly, retain a responsive Stop control, terminate workers, and proceed to recovery measurement when possible.

## 8. Practical result contract

The first screenful must answer:

1. What is this device comfortable doing?
2. What remains usable with compromises?
3. Where does it become frustrating?
4. What was directly measured?
5. How confident is the result?

Example:

> **Useful secondary computer**  
> Comfortable for email, ordinary browsing, writing, and 720p video. Moderate multitasking is usable with pauses. Heavy web workloads are frustrating.

Required capability outputs:

- highest comfortable workload;
- highest usable workload;
- typical and p95 interface response;
- repeated worst delay;
- on-time frame ratio;
- recovery time;
- highest comfortable video tier when tested;
- test browser and platform context;
- run confidence and integrity notes.

The A–E grade and 0–100 score are secondary comparison summaries. Every score shown must have a nearby plain-language interpretation.

## 9. Quick Check and Full Test

### Quick Check

Target: 2–3 minutes.

- preflight and warm-up;
- everyday web applications;
- documents and tables;
- browsing workload;
- staged light/moderate multitasking;
- recovery;
- practical capability report.

### Full Test

Target: 5–7 minutes.

- all Quick Check modules and additional measured rounds;
- visual smoothness;
- tiered video playback;
- browser storage;
- heavy workload stage where safe;
- complete role recommendations and comparison-quality confidence.

Durations are targets and may shorten through early stopping.

## 10. Integrity changes

- Focus loss and visibility changes invalidate affected measured windows.
- User interaction during a run invalidates the current window because it contaminates an unattended benchmark.
- Network transfers, asset decoding warm-up, and service-worker installation are excluded from scores.
- Browser timer reduction and unavailable APIs lower confidence; they do not create invented metrics.
- A run records browser family/version when available and always states that results describe the computer-and-browser combination.

## 11. Implementation sequence

The revised first vertical slice is:

1. lightweight landing and preflight;
2. benchmark controller with cancellation, interruption handling, and checkpointing;
3. automated inbox action driver with visible state changes;
4. two-animation-frame presentation timing, event-loop lag, Long Task, and frame-cadence collection;
5. baseline and bounded pressure stages;
6. recovery measurement;
7. capability-first result with raw metric disclosure and JSON export;
8. deterministic scoring tests.

Documents, browsing fixtures, video, storage, history, and comparison follow after the automated responsiveness slice is stable.

## 12. Architecture compatibility note

The benchmark logic must remain framework-independent even when a deployment shell uses a framework. Timed workloads, action definitions, collectors, scoring functions, and workers must not depend on UI-framework internals. This preserves the option to ship the final measured route as a minimal Vanilla TypeScript bundle, as required by the base architecture, after prototype validation.

## 13. Acceptance criteria for automation-first MVP

- A user can obtain a valid Quick Check result after one intentional Start action and no timed interaction.
- The screen visibly demonstrates every workload it measures.
- Test data is deterministic and local after preparation.
- The Stop control remains available during every stage.
- Severe slowdown causes bounded early stopping rather than prolonged freezing.
- Results lead with capabilities and limits rather than a composite score.
- Exported data preserves raw samples, stage outcomes, browser context, configuration version, and calculation trace.
- The interface never claims to diagnose CPU, RAM, storage hardware, thermals, or battery health from browser evidence.
