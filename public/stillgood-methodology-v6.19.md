# StillGood methodology v6.19

**Benchmark profile:** `6.19.0-paired-reserve-repeatability`
**Result schema:** `stillgood-result.v6.19`
**Published:** August 2026
**Status:** experimental, physical-device calibration in progress

## Purpose

StillGood asks what a computer-and-browser combination can still do
comfortably. It automatically recreates local browsing, webmail, writing,
spreadsheet, visual, video, multitasking, memory-pressure, persistent-save, and
recovery work. It reports practical uses and limits alongside the score.

## Measurement protocol

Fixtures are deterministic and local. Journeys warm before repeated scoring,
workloads rise gradually, severe delays stop later work, and a clean result near
a grade boundary receives confirmation samples. Measurements retain median and
tail response, hitches, visible completion, frame delivery, video drops,
recovery, memory-pressure probes, and verified browser-storage timings.

Canvas, WebAssembly, IndexedDB, and persistent-file paths receive untimed
initialization. The first full-size persistent-file observation remains in the
export as a cold diagnostic; repeated observations determine the steady score.
This exposes occasional catch-up behavior without counting one cold event
multiple times.

## Application workloads

- Browsing covers articles, search, shopping, navigation, filters, and busy
  layouts.
- Email covers large-mailbox search and sort, rich messages, conversations,
  labels, and composition.
- Documents cover long-text search, editing, formatting, tables, images, word
  wrapping, layout reflow, save, and reopen.
- Spreadsheets cover formulas, sort, filter, paste, search, and scrolling.
- Visuals use deterministic Canvas scenes against a common 60 fps target.
- Video uses bundled H.264 clips through 1080p, with 1080p60, 1440p, and 4K
  attempted only when earlier evidence justifies them.
- Memory pressure uses bounded touched WebAssembly working sets, object churn,
  foreground probes, and recovery. It does not claim exact installed RAM.
- Persistent saves use IndexedDB and verified OPFS write, flush, reopen, and
  random-read work. It does not claim raw physical-drive throughput.

## Paired mixed-workload reserve

A High-confidence preliminary result enters reserve only when its score,
headroom, five core categories, memory, and storage clear published gates. The
stage warms once, measures fixed demanding browsing, email, document,
spreadsheet, and image-edit actions unloaded, then repeats the exact same data,
seeds, actions, and repetition count while video, workers, memory, and storage
work overlap.

Reserve scoring uses a weighted geometric mean of absolute loaded p95 response
(45%), paired slowdown (30%), worst repeated loaded delay (15%), and frame
delivery (10%). The upper response curve preserves separation among already
fast results: 16 ms and 27 ms remain excellent but distinct.

Only an exceptional standard pressure level continues to a higher level with
four compute workers, a larger bounded working set, a 128 MB persistent save,
and higher-resolution video. Standard evidence contributes 65% and the higher
level 35%. Devices below this gate finish sooner and are not penalized for the
unattempted level.

The reserve result can cap but never raise the final score. A completed run
without reserve evidence remains eligible for B+ but not an A-range claim.

## Scoring and grades

Core application categories combine 78% ordinary responsiveness and 22%
adaptive capacity. Overall evidence uses a weighted geometric mean so strong
areas cannot completely hide a weak one. Memory and storage are asymmetric
diagnostics: poor behavior can lower or cap a result, while fast browser
storage cannot inflate it like a drive benchmark. Shared persistent-file
evidence receives one practical penalty, not two.

| Score | Grade | Interpretation |
|---:|:---:|---|
| 98-100 | A+ | Modern-fast |
| 94-97 | A | Fast |
| 90-93 | A- | Very capable |
| 86-89 | B+ | Strong second-life |
| 82-85 | B | Comfortable second-life |
| 78-81 | B- | Useful second-life |
| 74-77 | C+ | Capable light-use |
| 68-73 | C | Light-use |
| 58-67 | C- | Focused-use |
| 45-57 | D | Single-purpose |
| 0-44 | E | Struggling |

## Repeatability and browser treatment

Recent locally saved results from the same profile, browser family, platform,
and logical-processor count form a comparison range. A span over five points is
reported as variable performance. This range never changes scoring and is not
included in anonymous telemetry.

Chromium is the reference path; Firefox is experimental. StillGood applies no
browser-name multiplier, offset, or platform correction. Results describe the
measured computer-and-browser combination.

## References

- [Speedometer 3.1 methodology](https://browserbench.org/Speedometer3.1/about.html)
- [ARES-6 methodology](https://browserbench.org/ARES-6/about.html)
- [MotionMark methodology](https://browserbench.org/MotionMark/about.html)
- [PCMark 10 scoring](https://support.benchmarks.ul.com/support/solutions/articles/44002182065-how-are-pcmark-10-benchmark-scores-calculated-)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [W3C Long Tasks](https://www.w3.org/TR/longtasks-1/)
- [Media Playback Quality](https://w3c.github.io/media-playback-quality/)
- [WHATWG File System Standard](https://fs.spec.whatwg.org/)
