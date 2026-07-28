# StillGood methodology whitepaper

**Title:** Measuring what a computer is still good for
**Benchmark profile:** `6.9.0-browser-neutral-compatibility-adapters`
**Published:** July 2026

## Abstract

StillGood is a browser-based system-usability benchmark for older, repaired,
low-power, and second-life computers. It recreates recognizable work, measures
where visible response begins to break down, and reports useful roles and
limits instead of relying on one unexplained speed number.

It measures a computer-and-browser combination under controlled local
workloads. Principal observations include typical and tail latency, visible
completion, frame delivery, consistency, recovery, and the highest workload
that remains comfortable or usable.

## Research question

> Can this computer, in this browser and configuration, perform recognizable
> everyday work without delays that meaningfully disrupt the user?

Peak throughput alone cannot answer that question. StillGood retains both
central tendency and tails, evaluates multiple browser mechanisms, and turns
the evidence into task-specific guidance.

## Design principles

1. Exercise representative DOM, layout, text wrapping, painting, Canvas, media,
   worker, and storage mechanisms.
2. Use deterministic local inputs.
3. Measure through a visible presentation opportunity.
4. Retain percentiles, hitch ratios, and worst repeated delays.
5. Increase workload adaptively and stop safely.
6. Report practical roles and limits before technical detail.
7. State browser constraints honestly.
8. Version every measurement or scoring change.

## Protocol

The automatic run performs preflight and local caching, warmup and repeated
journeys, gradual workload expansion, safe early termination, recovery
measurement, and practical interpretation. The page should remain focused and
the device should be left alone. Extensions, background programs, thermal
state, updates, and power policy can change the result.

## Workloads

| Module | Controlled work | Evidence |
|---|---|---|
| Browsing | Articles, search, shopping, filtering, images | Rendered-action latency, tails, hitches |
| Email | Search, sort, open, label, compose | Everyday response and reserve |
| Documents | Long text, tables, images, wrapping, formatting | Edit-to-paint latency and reflow |
| Spreadsheets | Formula, sort, filter, paste, search, scroll | Operation latency and capacity |
| Multitasking | Foreground interaction with overlapping worker work | Foreground lag and recovery |
| Visuals | Increasingly dense Canvas scenes | Common-60-fps delivery and long frames |
| Video | Local H.264 at 480p, 720p, and 1080p | Frames, drops, progress, wait duration |
| Memory | Bounded active working sets swept in a worker | Foreground tails and recovery |
| Storage | IndexedDB and verified OPFS files | Commit tails and large-save pauses |

## Measurement

Timing uses `performance.now()`. Repeated journeys retain median, 75th, 95th,
99th, and worst values. Long tasks, long animation frames, timer probes, and
frame delivery expose congestion.

Version 6.8 measures cumulative and longest post-start media waiting duration.
A brief event under 100 milliseconds does not become a stall without supporting
evidence. Delivered frames, dropped frames, media progress, and completion
remain independent checks.

Version 6.9 adds browser-neutral compatibility adapters. Repeated
user-facing text sorts derive fixed-locale alphabetical ranks once for the
fixture's unique labels, then compare those ranks inside timed large-array
sorts. Every browser receives the same data, ordering, actions, and score
thresholds. Adapters may correct how work is invoked or observed; they never
multiply a score based on browser identity.

Normal through demanding tiers define everyday capability. Extended and maximum
tiers define reserve. Extended tiers remain in weighted evidence but cannot
alone trigger the hard minimum intended for ordinary activity.

## Scoring

Tier scoring combines typical journey latency, worst repeated latency,
action-level tails, hitch frequency, and variability. Category evidence uses a
weighted geometric mean.

| Evidence | Relative weight |
|---|---:|
| Browsing | 22 |
| Multitasking | 17 |
| Visuals | 13 |
| Video | 12 |
| Spreadsheets | 10 |
| Email | 9 |
| Documents | 9 |
| Consistency | 8 |
| Recovery | 5 |

Memory and storage can lower a result when poor but do not increase the base
score merely for being fast.

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

## Limits

StillGood cannot directly measure boot time, battery condition, temperature,
total operating-system memory pressure, raw physical disk throughput, every
native desktop application, or internet quality. Results describe the tested
browser and configuration.

## References

- [Speedometer 3 methodology](https://browserbench.org/Speedometer3.0/about.html)
- [Speedometer 3.1 cross-browser corrections](https://browserbench.org/announcements/speedometer3.1/)
- [Locale-aware sorting guidance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [W3C Long Tasks](https://www.w3.org/TR/longtasks-1/)
- [W3C Long Animation Frames](https://www.w3.org/TR/long-animation-frames/)
- [Media Playback Quality](https://w3c.github.io/media-playback-quality/)
- [WHATWG File System Standard](https://fs.spec.whatwg.org/)
- [IndexedDB durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability)
