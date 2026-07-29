# Benchmark v6.13 — browser evidence boundary

**Profile identifier:** `6.13.0-browser-evidence-boundary`  
**Result schema:** `stillgood-result.v6.13`  
**Evidence policy:** `browser-evidence-v1.0`

## Decision

StillGood no longer applies a browser-name multiplier, offset, cap exception,
or threshold change. The provisional Firefox graphics and aggregate-headroom
factors introduced in v6.12 are retired.

The result now distinguishes two kinds of evidence:

1. **Web Experience** preserves the behavior the user actually receives in the
   tested browser. Browsing, webmail, web documents, spreadsheets,
   multitasking, visual smoothness, video, response consistency, and web
   workload reserve belong here.
2. **Resource Resilience** covers controlled active-memory pressure,
   persistent browser storage, and recovery after load. Browser compatibility
   work in this group may ensure equal work or equivalent observation, but it
   may not add a browser-specific score adjustment.

Chromium remains the reference and most thoroughly validated browser path.
Firefox is supported experimentally. A Firefox result may differ from a
Chromium result because the measured Web Experience genuinely differs, not
because the scoring engine rewards or penalizes the browser name.

## Why this boundary is preferable

A browser is part of the experience being tested. If text reflow, large table
work, DOM updates, scrolling, graphics, or video is slower in one browser, that
difference is useful to the person choosing how to run an older computer.
Removing it would make the practical report less truthful.

At the same time, a browser-specific API implementation must not be mistaken
for proof that the physical computer has proportionally less memory, storage,
or processing capacity. Resource Resilience therefore uses fixed workloads and
narrow compatibility adapters. These adapters correct unequal work or
different observation mechanisms; they do not multiply final scores.

## Scoring behavior

- Chromium measurements, thresholds, weights, caps, and penalties are
  unchanged from v6.9 through v6.13.
- Firefox graphics and headroom now remain raw, measured evidence.
- The overall practical grade still combines the real Web Experience with
  memory, storage, recovery, and other practical-limit rules.
- The exported result includes both evidence-group summaries and states that
  post-score normalization was not applied.
- Comparisons should use the same benchmark profile and browser family whenever
  possible.
- Resource Resilience uses the existing large-flush and weak-memory guardrails,
  so one delayed persistent save cannot be hidden by quick recovery or a strong
  active-memory result.

## Presentation

The main result keeps one overall grade and plain-language recommendations.
The at-a-glance view additionally reports:

- **Web experience in the tested browser**
- **Memory, saves & recovery**

Firefox reports identify its support level as experimental. Technical
calibration factors are no longer shown because none are applied.

## Validation requirements

Regression tests enforce that changing only `browserFamily` cannot alter a raw
score, grade, graphics score, headroom score, Web Experience score, or Resource
Resilience score. Real cross-browser differences must originate in the
measurements themselves.

Reference export replay:

| Device/browser evidence | v6.13 result | Web Experience | Resource Resilience |
|---|---:|---:|---:|
| Dell workstation, Chromium | A+ 98 | 98 | 100 |
| Dell workstation, Firefox | B+ 87 | 95 | 100 |
| HP second-life laptop, Chromium | B+ 87 | 93 | 99 |
| HP second-life laptop, Firefox | B 85 | 92 | 98 |
| Lenovo ARM Chromebook, Firefox | C- 63 | 75 | 75 |

The strong Resource Resilience scores on the older devices do not erase weak
graphics or limited web-work reserve. They say only that the controlled memory,
storage, and recovery work remained comparatively steady in those particular
runs.
