# StillGood methodology v6.24

**Benchmark profile:** `6.24.0-calibrated-top-range`  
**Result schema:** `stillgood-result.v6.24`  
**Published:** August 2026  
**Status:** experimental, physical-device calibration in progress

## Purpose

StillGood asks what a computer-and-browser combination can still do
comfortably. It recreates local browsing, webmail, writing, spreadsheet,
visual, video, multitasking, memory-pressure, persistent-save, recovery, and
advanced web-application work. It reports useful roles and practical limits
alongside a public score.

## Measurement protocol

Fixtures are deterministic and local. Journeys warm before repeated scoring,
workloads rise gradually, severe delays stop later work, and a clean result near
a grade boundary receives confirmation samples. Boundary decisions use the
hidden 1000-point result rather than the rounded public number. Measurements
retain typical and tail response, hitches, visible completion, frame delivery,
video drops, recovery, memory-pressure probes, and verified browser-storage
timings.

Canvas, WebAssembly, IndexedDB, PDF.js, and persistent-file paths receive
untimed initialization where cold startup is not the intended observation.
Startup remains a separate measurement for the advanced data application. The
first full-size persistent-file observation is retained as a cold diagnostic;
repeated observations determine its steady score.

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
  random-read work. They do not claim raw physical-drive throughput.

## Paired mixed-workload reserve

A high-confidence preliminary result enters reserve when it scores at least 89,
all five core categories score at least 86, and its memory and storage evidence
do not already impose a lower practical ceiling. Headroom remains measured
evidence but is not a participation gate. The stage measures fixed demanding
browsing, email, document, spreadsheet, PDF, and image-edit actions unloaded,
then repeats the same data, seeds, actions, and repetition count while video,
workers, memory, and storage work overlap.

Reserve-qualified devices also run an advanced web-work suite:

- PDF.js opens, searches, lays out, and renders a deterministic multipage PDF.
- Official SQLite WebAssembly runs an in-memory indexed data application with
  inserts, updates, grouped analysis, search, and sorted retrieval.
- Acorn parses deterministic, application-sized JavaScript into a real
  abstract syntax tree.
- JSON serialization and parsing move an application-sized structured dataset.
- The data suite runs in a Web Worker while foreground response is measured.

The unloaded and loaded data workers use the same suite size, content, and
minimum observation window: seven seconds for standard reserve and ten seconds
for extended reserve. Their iteration counts are retained separately. Setup,
median, p95, worst repeated time, and paired loaded-to-unloaded slowdown are
recorded.

Frame-delivery monitoring begins when the overlapping foreground journey starts
and ends when that journey finishes. Memory preparation, media loading, storage
cleanup, and working-set release are outside the expected-frame interval.

The complete ordinary result is the anchor for reserve scoring and is not
capped or replaced. Standard reserve strength follows a smooth curve from 75 to
98 and can fill up to 30% of the distance remaining to 100. Extended reserve
strength follows a deliberately demanding curve from 98 to 100 and can fill up
to another 20% of the remaining distance. A missing, unsupported, interrupted,
or weak reserve contributes zero and never subtracts from the established
everyday result.

In internal 0-to-1000 units, the final calculation is:

```text
remaining = 1000 - everyday
fill = 0.30 * standard_strength + 0.20 * extended_strength
final = everyday + remaining * fill
```

This preserves differences already demonstrated by common workloads, avoids a
threshold cliff, and makes progressively higher scores harder to earn.

## Internal evidence matrix

The user-facing score remains a whole number from 0 to 100. Scoring calculations
retain higher-resolution normalized evidence on a hidden 0-to-1000 scale:

- Browsing, email, writing, spreadsheets, and multitasking retain everyday,
  capacity, and combined cells.
- Visual smoothness, video, consistency, memory behavior, browser storage,
  recovery, headroom, and upper reserve retain their own cells.
- Each cell comes from continuous interpolation of measured observations before
  rounding. Video retains continuous dropped-frame and stall evidence rather
  than reducing playback immediately to a broad status bucket.
- The base composite is a weighted geometric mean of applicable normalized
  cells. This limits compensation by one exceptional category for a weak one.
- Memory, storage, headroom, and consistency safeguards are then applied
  asymmetrically so fast storage cannot inflate a web-usability score.
- The complete safeguarded everyday result, standard and extended reserve
  strengths, remaining distance, and awarded fill remain visible in the export.
- Only the final safeguarded internal result is rounded to the public 0-to-100
  score.

The 1000-point matrix preserves real interpolation; it does not claim
ten-times-better measurement accuracy. Repeatability guidance remains part of
the result. A public score around 50 remains a single-purpose or constrained
result, not an average modern computer.

### Calibrated upper range

Version 6.24 leaves internal results through 900 unchanged. Above that point,
explicit monotonic anchors reserve increasing room for exceptional systems:
940 maps to 930, 980 maps to 960, 990 maps to 980, and a perfect 1000 remains
1000. Values between anchors are linearly interpolated before the public score
is rounded.

This calibration changes only the public upper range. It does not alter any
category measurement, reserve observation, safeguard, or device ordering, and
hardware age is never an input. It prevents an excellent older workstation
from occupying nearly all the remaining scale merely because ordinary browser
work is already comfortable.

## Public grades

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

- [JetStream 3 in-depth methodology](https://browserbench.org/JetStream/in-depth.html)
- [Speedometer 3.1 methodology](https://browserbench.org/Speedometer3.1/about.html)
- [PCMark 10 score calculation](https://support.benchmarks.ul.com/support/solutions/articles/44002182065-how-are-pcmark-10-benchmark-scores-calculated-)
- [PCMark 10 repeatability guidance](https://support.benchmarks.ul.com/support/solutions/articles/44002160516-overview-of-pcmark-10-performance-benchmarks)
- [NIST Technical Note 1297](https://www.nist.gov/pml/nist-technical-note-1297)
- [PDF.js examples](https://mozilla.github.io/pdf.js/examples/)
- [SQLite WebAssembly documentation](https://sqlite.org/wasm/doc/trunk/index.md)
- [Acorn JavaScript parser](https://github.com/acornjs/acorn)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [W3C Long Tasks](https://www.w3.org/TR/longtasks-1/)
- [Media Playback Quality](https://w3c.github.io/media-playback-quality/)
- [WHATWG File System Standard](https://fs.spec.whatwg.org/)


