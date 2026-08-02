# StillGood methodology whitepaper

**Title:** Measuring what a computer is still good for  
**Benchmark profile:** `6.17.1-headroom-continuity`  
**Result schema:** `stillgood-result.v6.17.1`  
**Published:** August 2026

## Abstract

StillGood is a browser-based usability benchmark for older, repaired,
low-power, and second-life computers. It automatically recreates recognizable
web, office, media, multitasking, memory-pressure, and persistent-storage work.
It measures visible response, consistency, sustained capacity, and recovery,
then reports useful roles and practical limits rather than one unexplained
speed number.

StillGood measures a computer-and-browser combination. It cannot directly
inspect total operating-system memory pressure, battery condition, temperature,
or raw physical-drive throughput.

## Research question

> Which common jobs can this computer-and-browser combination still perform
> comfortably, and where do delays become disruptive?

It is not intended to rank browser engines, processors, frameworks, or storage
devices in isolation.

## Test protocol

The user starts one automatic test and leaves the tab focused. StillGood then:

1. loads and warms bundled local assets outside measured time;
2. establishes display cadence and foreground-delay baselines;
3. repeats deterministic ordinary workload tiers;
4. increases work gradually and stops modules safely after a clear limit;
5. runs an upper-reserve confirmation only for qualifying A-level results;
6. measures recovery after overlapping work; and
7. stores the full observations with benchmark and browser versions.

Network transfer is excluded from measured workloads. Focus loss and unsettled
background activity reduce confidence because they can distort a result.

## Workloads

### Web and office experience

The local fixtures exercise:

- article, search-result, catalog, navigation, dashboard, and image-grid work;
- inbox searches, sorting, thread expansion, labels, and composing;
- long-document editing, text reflow, search, styling, images, and tables;
- spreadsheet sorting, filtering, formulas, range updates, search, and scrolling;
- foreground interaction while controlled Web Workers remain busy; and
- HTML, CSS, DOM, Canvas, scrolling, and visible frame delivery.

These scripted journeys perform real JavaScript, DOM mutation, style
calculation, layout, word wrapping, painting, and presentation. The fixtures are
deterministic and local so changing websites, advertisements, and network speed
do not contaminate the measurements.

### Video

Bundled H.264 video progresses from 480p30 through 1080p30. Strong earlier
results may unlock 1080p60 and 1440p30; 4K30 runs only after both remain
comfortable. StillGood retains displayed and dropped frames, media progress,
total waiting time, the longest interruption, and the highest comfortable
resolution. Optional tiers describe media headroom without redefining the
everyday video score.

### Resource resilience

StillGood touches and revisits bounded WebAssembly working sets while
object-heavy JavaScript creates garbage-collection pressure. It also commits
IndexedDB transactions and writes, flushes, reopens, randomly reads, and
verifies origin-private files when supported. These are browser-observed
capacity and responsiveness checks, not direct RAM or SSD specifications.

## Upper-reserve confirmation

A clean preliminary score of at least 94 must demonstrate more than short-burst
speed. The extra stage runs only when confidence is High, ordinary headroom is
at least 87, every core category is at least 88, memory remains top-grade
eligible, and available storage evidence is at least 88.

Qualifying devices receive:

- much larger inbox, document, browsing, and spreadsheet datasets, including
  timed preparation and visible interaction;
- 10 seconds of sustained foreground multitasking with up to four workers;
- 7 seconds of dense visual work under worker pressure;
- touched and revisited memory stages up to 2 GB;
- a verified 256 MB persistent write, flush, reopen, and random-read check; and
- a fresh recovery measurement.

Devices below this gate skip the extension and keep the ordinary scoring path.
A failed or aborted reserve check remains explicit evidence instead of being
silently omitted.

## Measurement

StillGood records:

- median, 75th-, 95th-, and 99th-percentile response;
- worst repeated delay, hitch frequency, and variation;
- action work time and presentation time;
- Long Tasks and Long Animation Frames when supported;
- frames delivered against a common 60 fps target and long-frame rate;
- displayed and dropped video frames plus sustained stalls;
- allocation, touch, revisit, garbage-collection, and foreground-probe timing;
- storage write, flush, reopen, random-read, and integrity evidence; and
- time required to return to the foreground baseline.

Repeated observations matter because a computer can feel quick most of the
time yet produce disruptive catch-up pauses. Tail latency and variability are
therefore retained alongside normal speed.

## Browser treatment

Chromium is the reference and most thoroughly validated browser path. Firefox
support is experimental. Version 6.17.1 applies no browser-name multiplier,
offset, cap exception, or threshold change. Browser-visible differences in
browsing, office, graphics, video, and multitasking remain part of the measured
experience. Resource checks use equal-work compatibility methods.

Changing only the recorded browser-family label cannot change a score. For the
strongest comparisons, use the same profile, browser family, power condition,
thermal condition, and extension setup.

## Scoring

The base evidence uses these relative weights:

| Evidence | Weight |
|---|---:|
| Browsing | 22 |
| Multitasking | 17 |
| Visuals | 13 |
| Video | 12 |
| Spreadsheets | 10 |
| Email | 9 |
| Documents | 9 |
| Responsiveness consistency | 8 |
| Recovery | 5 |

A weighted geometric mean prevents several excellent categories from hiding a
serious weakness. Upper-reserve tiers are excluded from ordinary category,
headroom, responsiveness, graphics, and confidence aggregation; they influence
the result once through the dedicated upper-reserve ceiling. Memory and
persistent storage are asymmetric diagnostics:
poor behavior may lower or cap a result, while fast browser-storage behavior
does not inflate the score as though it were a raw hardware benchmark.

Ordinary tiers determine everyday capability. Adaptive headroom tiers locate a
practical limit. For qualifying A-level results, the upper-reserve score combines
larger office work, sustained multitasking, dense visuals, memory, storage, and
recovery. It can cap the final score at 100, 97, 96, 95, 94, or 92 according to
the strength of the sustained evidence; it never raises a score.

When ordinary headroom is below 88, its ceiling follows the measured value
continuously: each additional headroom point permits one additional final-score
point. There is no shared 87-point shelf. For example, headroom scores of 82,
84, and 87 permit maximum scores of 89, 91, and 94.

The grade ladder is:

| Score | Grade | Interpretation |
|---:|:---:|---|
| 98â€“100 | A+ | Modern-fast |
| 94â€“97 | A | Fast |
| 90â€“93 | Aâˆ’ | Very capable |
| 86â€“89 | B+ | Strong second-life |
| 82â€“85 | B | Comfortable second-life |
| 78â€“81 | Bâˆ’ | Useful second-life |
| 74â€“77 | C+ | Capable light-use |
| 68â€“73 | C | Light-use |
| 58â€“67 | Câˆ’ | Focused-use |
| 45â€“57 | D | Single-purpose |
| 0â€“44 | E | Struggling |

## Stable interpretation

The numeric score remains continuous, but plain-language results use wider,
stable capability bands. High-confidence runs show a two-point interpretation
allowance, medium-confidence runs four points, and low-confidence runs six,
increased when measured variation warrants it. A relative weak area is called
out only when the strongest and weakest everyday categories differ by at least
12 points.

An initial clean result within one point of a grade or headline capability
boundary triggers a short confirmation pass over up to three influential core
workloads. The final result is recalculated from all raw samples without an
offset or preferred side of the boundary.

## Validity and limitations

Meaningful properties include deterministic local fixtures, repeated samples,
adaptive headroom, human-visible latency thresholds, tail measurements,
integrity checks, versioned methodology, and replay tests against physical
devices.

StillGood cannot guarantee performance in every native desktop application.
Web document reflow and spreadsheet work exercise related mechanisms, but
LibreOffice and Microsoft Office may behave differently. It also cannot
directly measure boot time, battery health, temperature, system-wide pressure,
or physical-drive throughput. The coarse 2, 4, or 8+ GB browser memory hint is
never interpreted as exact installed memory.

## References

- [Speedometer methodology](https://browserbench.org/Speedometer3.1/about.html)
- [Speedometer test instructions](https://browserbench.org/Speedometer3.0/instructions.html)
- [Speedometer 3.1 equal-work corrections](https://browserbench.org/announcements/speedometer3.1/)
- [WebXPRT FAQ](https://www.principledtechnologies.com/benchmarkxprt/webxprt/faq)
- [MotionMark methodology](https://browserbench.org/MotionMark/about.html)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [W3C Long Tasks](https://www.w3.org/TR/longtasks-1/)
- [W3C Long Animation Frames](https://www.w3.org/TR/long-animation-frames/)
- [Media Playback Quality](https://w3c.github.io/media-playback-quality/)
- [W3C Device Memory API](https://www.w3.org/TR/device-memory/)
- [WebAssembly linear-memory growth](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Memory/grow)
- [WHATWG File System Standard](https://fs.spec.whatwg.org/)
