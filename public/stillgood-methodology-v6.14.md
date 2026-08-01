# StillGood methodology whitepaper

**Title:** Measuring what a computer is still good for  
**Benchmark profile:** `6.14.0-memory-reserve`  
**Published:** July 2026

## Abstract

StillGood is a browser-based usability benchmark for older, repaired,
low-power, and second-life computers. It automatically recreates recognizable
web, office, media, multitasking, memory-pressure, and persistent-storage work.
It measures where visible response begins to break down and reports useful
roles and practical limits rather than relying on one unexplained speed number.

StillGood measures a computer-and-browser combination. It cannot directly
inspect total operating-system memory pressure, battery condition, temperature,
or raw physical-drive throughput.

## Research question

The benchmark asks:

> Which common jobs can this computer-and-browser combination still perform
> comfortably, and where do delays become disruptive?

It is not intended to rank browser engines, processors, frameworks, or storage
devices in isolation.

## Test protocol

The user starts one automatic test and leaves the tab focused. StillGood then:

1. loads and warms local assets outside measured time;
2. establishes a foreground-delay baseline;
3. runs fixed, deterministic workload tiers;
4. repeats ordinary tiers five times and adaptive headroom tiers three times;
5. stops a module early when continued pressure would provide little useful
   evidence;
6. measures recovery after overlapping work; and
7. saves the full observations with the benchmark and browser versions.

Network transfer is excluded from measured workloads. The test records focus
loss and unsettled background activity because either can reduce confidence.

## Workloads

### Web Experience

Web Experience deliberately preserves the performance of the tested browser:

- article, catalog, search-result, and dashboard-style browsing;
- large inbox searches, sorting, thread expansion, and composing;
- long-document editing, text reflow, search, styling, and tables;
- spreadsheet sorting, filtering, formula recalculation, and range updates;
- foreground work while controlled Web Workers remain busy;
- HTML, Canvas, CSS, scrolling, and frame delivery;
- local H.264 video playback at multiple resolutions;
- foreground response consistency and web workload reserve.

If Firefox and Chromium perform these operations differently on the same
computer, StillGood keeps the difference. That is part of the experience a
person will actually receive.

### Resource Resilience

Resource Resilience covers:

- foreground response while deterministic data remains active in a worker;
- allocation, copy round trips, retained-data checks, and safe release;
- IndexedDB commits, reopen and verification;
- origin-private persistent-file write, flush, reopen, random read, and
  verification when supported; and
- recovery after controlled overlapping work.

These are still browser-observed measurements, not direct hardware tests.
Compatibility adapters may ensure equal work or equivalent observation, but
they do not add browser-specific score points.

## Measurement

StillGood records more than average completion time:

- median, 75th-, 95th-, and 99th-percentile response;
- worst repeated delay;
- hitch frequency and coefficient of variation;
- Long Tasks and Long Animation Frames when supported;
- frames delivered on time, long-frame rate, and worst frame;
- video completion, delivered and dropped frames, and sustained stalls;
- the browser's coarse 2, 4, or 8+ GB memory hint when available;
- staged WebAssembly working-set touches, revisits, and foreground probes;
- object-heavy JavaScript churn and its worst allocation round;
- storage write, flush, reopen, random-read, and verification evidence; and
- time required to return to the normal foreground baseline.

Repeated observations are used because old computers often feel acceptable
most of the time but produce occasional catch-up pauses. Tail latency and
variability therefore matter alongside typical speed.

## Browser treatment

Chromium is StillGood's reference and most thoroughly validated browser path.
Firefox support is experimental.

Version 6.14 applies no browser-name multiplier, offset, cap exception, or
threshold change. Changing only the recorded browser family cannot change a
score. Cross-browser differences must originate in measured behavior.

The result exports:

- the tested browser and version;
- Web Experience and Resource Resilience summaries;
- the fixed compatibility-adapter profile; and
- an explicit statement that post-score normalization was not applied.

For the strongest comparisons, use the same benchmark profile, browser family,
power condition, thermal condition, and extension setup.

## Scoring

The weighted base evidence is:

| Evidence | Relative weight |
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

A weighted geometric mean prevents several excellent categories from hiding
one serious weakness. Practical caps cover weak everyday work, poor visuals or
video, inconsistent foreground response, limited web workload reserve, and
slow persistent saves.

Memory and persistent storage are asymmetric diagnostics: poor behavior may
lower a result, but fast browser-storage behavior does not inflate the base
grade as if it were a direct SSD benchmark. Memory reserve also controls
eligibility for the highest grade bands. A browser-reported 2 or 4 GB class
applies a conservative capacity ceiling; an 8+ response is resolved with
measured stages rather than treated as an exact installed-memory amount.
Browsers without the hint use measured behavior alone.

Resource Resilience also retains large-save and weak-memory guardrails, so one
clear persistent-save pause cannot be hidden by fast recovery or another strong
resource result.

The overall grade remains the simplest summary. Web Experience, Resource
Resilience, category outcomes, capability recommendations, cautions, and the
full exported observations explain what that grade means.

## Validity and limitations

Meaningful properties include deterministic local fixtures, repeated samples,
adaptive headroom, human-visible latency thresholds, tail measurements,
integrity checks, versioned methodology, and replay tests against physical
devices.

StillGood cannot guarantee performance in every native desktop application.
Web document reflow and spreadsheet work exercise many of the same broad
mechanisms—text, layout, arrays, formulas, memory, and rendering—but LibreOffice
or Microsoft Office can behave differently.

Results can also change with extensions, acceleration settings, browser
updates, power policy, heat, background programs, and operating-system updates.

## Methodological references

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
