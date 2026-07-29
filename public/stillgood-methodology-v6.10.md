# StillGood methodology whitepaper

**Title:** Measuring what a computer is still good for
**Benchmark profile:** `6.10.0-isolated-browser-graphics-adapter`
**Published:** July 2026

## Abstract

StillGood is a browser-based system-usability benchmark for older, repaired,
low-power, and second-life computers. It recreates recognizable work, measures
where visible response begins to break down, and reports useful roles and
limits instead of relying on one unexplained speed number.

It is not a browser-engine microbenchmark and does not estimate abstract
hardware power. It measures a computer-and-browser combination under a
controlled set of local workloads. Its primary observations are typical and
tail latency, visible completion, frame delivery, consistency, recovery, and
the highest workload that remains comfortable or usable.

## 1. The research question

The benchmark asks:

> Can this computer, in this browser and configuration, perform recognizable
> everyday work without delays that meaningfully disrupt the user?

Peak throughput alone cannot answer that question. An old computer may complete
a large calculation slowly yet remain pleasant for writing, or it may post a
reasonable average while suffering intermittent multi-second pauses. StillGood
therefore retains both central tendency and tails, evaluates multiple
subsystems, and turns the evidence into task-specific guidance.

## 2. Design principles

1. **Representative mechanisms.** Exercise DOM mutation, style, layout, text
   wrapping, painting, Canvas, media, workers, and persistent browser storage.
2. **Deterministic inputs.** Bundle fixed datasets and assets so network speed,
   advertisements, analytics, and changing third-party sites do not enter the
   timed modules.
3. **Visible completion.** Time through the browser's opportunity to present
   the result, not merely the synchronous JavaScript function.
4. **Tail awareness.** Preserve percentiles, hitch ratios, and worst repeated
   delays because averages hide catch-up pauses.
5. **Adaptive headroom.** Give fast devices enough work to reveal limits while
   allowing weak hardware to stop safely.
6. **Practical output.** Report roles, cautions, and capacity before technical
   details.
7. **Honest boundaries.** Do not describe browser storage as raw SSD speed or a
   working-set probe as installed RAM.
8. **Versioned calibration.** Any scoring or measurement change creates a new
   profile and is checked against paired physical-device runs.

## 3. Test protocol

The automatic run performs five phases:

1. **Preflight and cache:** verify visibility, load local fixtures, establish
   display cadence, and sample idle response.
2. **Warm and repeat:** run deterministic journeys repeatedly so one cold start
   or scheduler interruption does not dominate.
3. **Increase gradually:** complete ordinary tiers before attempting adaptive
   extended and maximum tiers.
4. **Stop safely:** terminate a workload when severe delays make further
   measurement unhelpful.
5. **Recover and explain:** stop pressure, measure recovery, calculate the
   result, and produce practical guidance.

The page should remain visible and the device should be left alone. Extensions,
other programs, thermal state, update activity, and power policy can change the
result. Comparisons should use the same StillGood profile and similar run
conditions.

## 4. Workload modules

| Module | Controlled work | Principal evidence |
|---|---|---|
| Browsing | Article, search, shopping, navigation, filtering, and image grids | Rendered-action latency, tails, hitches, capacity |
| Email | Search, sort, open, label, and compose in a local inbox application | Everyday response and extended reserve |
| Documents | Long text, images, tables, formatting, wrapping, and layout changes | Edit-to-paint latency, reflow, search, recovery |
| Spreadsheets | Formula recalculation, sort, filter, paste, search, and scroll | Operation and visible-update latency, capacity |
| Multitasking | Foreground interaction while worker and browser work overlap | Foreground lag, task switching, recovery |
| Visuals | Deterministic Canvas scenes at increasing density | Common-60-fps delivery, long frames, reserve |
| Video | Local H.264 at 480p, 720p, and 1080p | Frames, drops, media progress, waiting duration |
| Memory pressure | Bounded active working sets swept in a worker | Foreground tail latency and recovery |
| Persistent saves | IndexedDB commits and OPFS write/flush/reopen/read/verify | Commit tails, large-save pauses, integrity |

These workloads are simulations, but they use the same browser mechanisms as
real webmail, document editors, spreadsheets, media sites, dashboards, and
offline web applications.

## 5. Measurement

Timing uses `performance.now()`, a monotonic high-resolution clock. Scripted
actions measure work and the following presentation opportunity. Repeated
journeys retain median, 75th, 95th, and worst values. Action-level observations
also retain hitch ratios above 250 and 500 milliseconds.

Where available, `PerformanceObserver` records long tasks and long animation
frames. A foreground timer probe supplies browser-neutral evidence of event-loop
delay during workers, memory pressure, and persistent storage. Graphics use
`requestAnimationFrame` but evaluate all displays against a common 60 fps
delivery target so high-refresh panels are not penalized.

Video uses `getVideoPlaybackQuality()` for delivered and dropped frames, with
`requestVideoFrameCallback()` as a frame-count fallback. Version 6.8 records the
duration of post-start waiting periods rather than treating every `waiting`
event as an equally visible stall.

Version 6.9 introduces a compatibility-adapter policy. An adapter may make the
same operation observable or invocable across engines, but it must not change
the workload, thresholds, or score according to browser identity. The first
adapter derives fixed-locale alphabetical ranks once for the fixture's unique
labels, then compares those ranks inside repeated large-array sorts. This
follows platform guidance to avoid repeated locale-service initialization and
keeps that setup outside the timed action.

Version 6.10 handles a different kind of compatibility problem: an isolated
browser graphics path that is dramatically weaker than the same run's ordinary
work and verified video. The graphics result is separated from the computer
grade only when the browser lacks both Long Tasks and Long Animation Frames
collectors, the median everyday core score is at least 80, graphics is below
58 and trails core work by at least 30 points, and video scores at least 90.
The visual score remains displayed, exported, and translated into a browser
warning. There is no user-agent branch or score multiplier.

Persistent storage uses asynchronous IndexedDB transactions and, where
available, origin-private synchronous access handles inside a worker. Files
contain deterministic non-empty data and are flushed, closed, reopened, sampled
at random offsets, and verified.

## 6. Everyday capability and reserve

Normal through demanding tiers answer whether a task is practical. Extended and
maximum tiers answer how much reserve remains.

Each latency category publishes:

- a complete score covering all measured tiers;
- an everyday score excluding adaptive `headroom` and `limit` tiers;
- the highest comfortable and usable tier;
- whether the limit was found or the test ceiling remained open.

The complete score remains in the weighted evidence and the extended tiers
remain central to the reserve label. Only the hard core-capability cap uses the
everyday score. An oversized inbox can therefore reveal poor reserve without
being mislabeled as ordinary email.

## 7. Scoring

Tier scoring combines typical journey latency, worst repeated latency,
action-level tail latency, hitch frequency, and variability. Continuous
normalization preserves differences inside the descriptive states.

Relative category weights are:

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

Weights are renormalized when an optional measurement is unavailable. A
weighted geometric mean prevents several perfect categories from completely
hiding a serious weakness.

Memory and storage are asymmetric diagnostics: poor behavior can lower the
result, but fast behavior does not inflate the base score. Additional caps
cover weak core activities, poor everyday graphics or video, inconsistent
response, limited reserve, and slow large-file saves.

An isolated visual-rendering limitation that passes every v6.10 compatibility
gate is reported separately rather than included in the computer grade. Broadly
weak graphics, weak graphics accompanied by weak core work, and all current
Chromium paths retain the original graphics weight and caps.

| Score | Grade | Meaning |
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

The grade is a summary. The capability guide, limiting category, reserve label,
large-save result, and raw measurements explain what the number means.

## 8. Validity and limitations

StillGood has practical construct validity because its fixtures exercise the
rendering, scripting, worker, media, and storage mechanisms used by real web
applications. Deterministic inputs and repeated observations improve
comparability. Multiple dimensions reduce dependence on any single synthetic
loop.

The benchmark cannot directly measure boot time, battery health, temperature,
total system memory pressure, physical disk throughput, every native
application, or internet quality. Results are specific to the tested browser
and configuration. Hardware acceleration and browser settings can materially
change media and graphics outcomes.

Calibration remains empirical. Thresholds and weights are versioned and should
be evaluated with paired runs across modern workstations, mainstream laptops,
low-power Chromebooks, mobile devices, and genuinely marginal hardware. Human
comfort ratings remain the ultimate external validation target.

## 9. References

- [Speedometer 3 methodology](https://browserbench.org/Speedometer3.0/about.html)
- [Speedometer test instructions](https://browserbench.org/Speedometer3.0/instructions.html)
- [Speedometer 3.1 cross-browser corrections](https://browserbench.org/announcements/speedometer3.1/)
- [WebXPRT FAQ](https://www.principledtechnologies.com/benchmarkxprt/webxprt/faq)
- [MotionMark methodology](https://browserbench.org/MotionMark/about.html)
- [Locale-aware sorting guidance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [W3C Long Tasks API](https://www.w3.org/TR/longtasks-1/)
- [W3C Long Animation Frames](https://www.w3.org/TR/long-animation-frames/)
- [High precision timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing)
- [Media Playback Quality](https://w3c.github.io/media-playback-quality/)
- [requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)
- [WHATWG File System Standard](https://fs.spec.whatwg.org/)
- [IndexedDB transaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability)
- [Web Workers](https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers)
