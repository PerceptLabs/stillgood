# StillGood methodology v6.18

**Benchmark profile:** `6.18.0-adaptive-mixed-reserve`
**Result schema:** `stillgood-result.v6.18`
**Published:** August 2026
**Status:** experimental, physical-device calibration in progress

## Purpose

StillGood asks what a computer-and-browser combination can still do
comfortably. It is intended for older, repaired, low-power, and second-life
devices. It is not a browser-engine shootout and does not infer a complete
hardware inventory.

The benchmark automatically recreates browsing, webmail, writing, spreadsheet,
graphics, video, multitasking, memory-pressure, persistent-save, and recovery
work. Results lead with practical uses and limitations. The numeric score and
grade are summaries of the retained evidence, not substitutes for it.

## Protocol

1. Preflight confirms visibility, caches local assets, samples idle response,
   and estimates the display cadence.
2. Deterministic application journeys warm once and then repeat. Ordinary
   tiers use five observations; extended capacity tiers use three.
3. Work increases from normal through demanding levels. A later tier is
   skipped when the previous tier is already severely delayed.
4. A clean result near a grade or capability boundary receives two additional
   observations in up to three influential core workloads.
5. Only a broadly strong preliminary result enters the mixed-workload reserve
   stage.
6. Recovery is measured before the final report is calculated.

The page should remain focused and the computer should be left alone. Thermal
state, power policy, extensions, background tabs, and other programs are valid
properties of that run, but can reduce repeatability.

## Workloads

| Module | Controlled work |
|---|---|
| Browsing | Articles, search results, shopping results, filtering, navigation, image grids, and busy layouts |
| Email | Large-mailbox search and sort, message and thread opening, labels, rich content, and composition |
| Documents | Long-text search, editing, formatting, table changes, image-aware layout, word wrapping, reflow, save, and reopen |
| Spreadsheets | Formula recalculation, sort, filter, paste, search, and scrolling over increasing cell sets |
| Visuals | Deterministic Canvas scenes evaluated against a common 60 fps usability target |
| Video | Bundled H.264 clips at 480p, 720p, and 1080p; 1080p60, 1440p, and 4K only when earlier evidence justifies them |
| Multitasking | Foreground journeys while controlled worker work overlaps |
| Memory pressure | Bounded, touched WebAssembly working sets, JavaScript garbage-collection churn, foreground probes, and recovery |
| Persistent saves | IndexedDB commits plus OPFS write, flush, reopen, random-read, foreground-lag, and integrity checks |

All application and media fixtures are local. Network speed, advertising,
analytics scripts, and changing third-party sites are excluded from measured
modules.

## What is measured

Rendered actions include real JavaScript, DOM updates, style calculation,
layout, text wrapping, painting, Canvas work, worker communication, media
decoding, and browser storage. Timing uses the browser's monotonic
high-resolution clock and waits for an opportunity to present the visible
update.

StillGood retains:

- median, 75th-, 95th-, and 99th-percentile response;
- worst repeated delay, hitch ratios, and coefficient of variation;
- synchronous work time and presentation time;
- Long Tasks and Long Animation Frames when supported;
- frame delivery against a 60 fps evaluation cadence;
- displayed and dropped video frames, media progress, and sustained stalls;
- touched-memory allocation, scan, copy, garbage-collection, probe, and
  recovery evidence; and
- storage write, durable flush, reopen, random-read, foreground-lag, and
  verification evidence.

Tail latency matters because a device can appear quick during most actions yet
produce the catch-up pauses that make it feel unreliable.

## Ordinary speed and capacity

Browsing, email, document, spreadsheet, and multitasking tiers are scored with
continuous latency curves. Sub-100 millisecond results do not collapse into one
perfect bucket: roughly 30, 50, and 80 milliseconds remain measurably distinct
while all can still be described as comfortable.

For each core application category, ordinary through demanding work contributes
78% and the adaptive extended/maximum capacity evidence contributes 22%.
This reflects the product question: normal responsiveness should dominate,
while the amount of remaining capacity must still be visible.

The practical tier weights descend from normal work toward extreme work:
24%, 23%, 21%, 18%, and 14%. If adaptive capacity runs, its last measured tier
receives 60% of the capacity subscore and the preceding tier 40%.

## Mixed-workload reserve stage

A High-confidence preliminary result enters the final reserve stage only when:

- preliminary score is at least 89;
- aggregate headroom is at least 83;
- browsing, email, documents, spreadsheets, and multitasking are each at least
  86; and
- measured memory and storage evidence, when available, clear their gates.

The reserve stage is one distinct dashboard, not a replay of isolated modules.
For about 12 seconds it overlaps:

- demanding browsing, inbox, document, and spreadsheet journeys;
- two compute workers;
- a bounded 384 or 512 MB retained working set;
- a verified 64 MB OPFS write with random reads;
- 1080p video playback; and
- a real 960×540 Canvas pixel edit, filter, draw, and resize operation.

The stage compares loaded 95th-percentile action response with the same
device's ordinary-action baseline. Its weighted geometric score uses:

| Reserve evidence | Weight |
|---|---:|
| Loaded 95th-percentile response | 40% |
| Slowdown relative to ordinary response | 32% |
| Worst repeated loaded delay | 18% |
| Frame delivery while work overlaps | 10% |

Temporary reserve memory and storage work are not inserted into the ordinary
memory or storage categories, so they cannot be counted twice. Its final
ceiling is the reserve score plus seven, bounded from 87 through 100, so one
reserve point can move the ceiling by no more than one point. The reserve
score can cap a final result but never raise it. A completed run without this
evidence can still earn B+ (87) and a strong second-life recommendation, but it
cannot claim an A-range modern-performance result.

## Overall scoring

The base evidence uses these relative weights:

| Evidence | Weight |
|---|---:|
| Browsing | 25 |
| Multitasking | 19 |
| Documents | 12 |
| Spreadsheets | 12 |
| Email | 10 |
| Responsiveness consistency | 10 |
| Visuals | 8 |
| Video | 4 |
| Recovery | 4 |

Weights are renormalized when an optional measurement is unavailable. A
weighted geometric mean prevents several excellent categories from completely
hiding one weak category. Memory and persistent-storage results are asymmetric
diagnostics: poor behavior can lower or cap a result, while a fast browser
storage result cannot inflate the score like a raw drive benchmark.

Aggregate headroom has a smooth final ceiling of `headroom + 12`, capped at
100. Moving headroom by one point therefore moves the ceiling by no more than
one point; there is no magic threshold jump.

The grade ladder is unchanged from v6.17.1:

| Score | Grade | Interpretation |
|---:|:---:|---|
| 98–100 | A+ | Modern-fast |
| 94–97 | A | Fast |
| 90–93 | A− | Very capable |
| 86–89 | B+ | Strong second-life |
| 82–85 | B | Comfortable second-life |
| 78–81 | B− | Useful second-life |
| 74–77 | C+ | Capable light-use |
| 68–73 | C | Light-use |
| 58–67 | C− | Focused-use |
| 45–57 | D | Single-purpose |
| 0–44 | E | Struggling |

An A− computer result is described as an excellent second-life computer. The
stronger “fast, modern-feeling computer” claim begins at A.

## Browser treatment

Chromium is the reference and most thoroughly validated browser path. Firefox
support is experimental. Version 6.18 applies no browser-name multiplier,
offset, threshold change, or platform correction. Browser-visible differences
remain part of the Web Experience. Resource checks use capability-gated,
equal-work compatibility methods.

Changing only a recorded browser or platform label cannot change the score.
For comparisons, use the same benchmark profile, browser family, power and
thermal conditions, and extension setup.

## Validity and limitations

The method follows established benchmark practices: deterministic local work,
warmup and repetition, representative user journeys, adaptive difficulty,
tail-latency reporting, geometric aggregation, confidence-aware confirmation,
early stopping, versioned methodology, and replay against physical-device
evidence.

StillGood cannot guarantee performance in every native application. Its web
document and spreadsheet work exercises relevant layout and data mechanisms,
but LibreOffice and Microsoft Office can differ. A browser cannot directly
measure boot time, battery health, temperature, system-wide pressure, exact
installed memory, or raw physical-drive throughput. The Device Memory API's 2,
4, or 8+ GB value is a privacy-limited hint, never an exact inventory.

## References

- [Speedometer 3.1 methodology](https://browserbench.org/Speedometer3.1/about.html)
- [ARES-6 methodology](https://browserbench.org/ARES-6/about.html)
- [MotionMark methodology](https://browserbench.org/MotionMark/about.html)
- [PCMark 10 score calculation](https://support.benchmarks.ul.com/support/solutions/articles/44002182065-how-are-pcmark-10-benchmark-scores-calculated-)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [W3C Long Tasks](https://www.w3.org/TR/longtasks-1/)
- [W3C Long Animation Frames](https://www.w3.org/TR/long-animation-frames/)
- [Media Playback Quality](https://w3c.github.io/media-playback-quality/)
- [W3C Device Memory API](https://www.w3.org/TR/device-memory/)
- [WHATWG File System Standard](https://fs.spec.whatwg.org/)
