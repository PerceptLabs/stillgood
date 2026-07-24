# StillGood Benchmark Methodology v2

**Decision date:** 2026-07-24  
**Status:** Implemented experimental profile  
**Target duration:** roughly one minute, extending toward 90 seconds on slower computers

## Why v1 was replaced

The first Fast Check established that the automated flow and exported evidence
worked, but it did not create enough separation between an old usable computer
and a workstation. Four easy categories could score 100 and overwhelm a weaker
responsiveness result. Workload-specific warm-up was missing, a p95 was
calculated from too few samples, long tasks and video stalls did not affect the
grade, and the only video fixture was 960×540.

Version 2 treats benchmark quality as a measurement-design problem rather than
a test-count problem.

## Research-derived rules

1. **Use representative journeys, not isolated microbenchmarks.** Speedometer 3
   uses complete application journeys across varied web workloads because tight
   API loops do not represent how browser subsystems interact.
2. **Warm up each workload before measuring it.** BenchmarkDotNet and Google
   Benchmark both distinguish discarded warm-up work from measured iterations.
3. **Repeat measurements.** SPEC CPU uses either the median of three runs or the
   slower of two. StillGood uses three measured repetitions for every
   foreground workload tier and retains every raw sample.
4. **Report variability.** StillGood calculates coefficient of variation for
   each tier and lowers confidence or applies a small scoring penalty when
   results are unstable.
5. **Measure several independent dimensions.** JavaScript, DOM/rendering,
   graphics, media decode, concurrent work, browser storage, and recovery are
   kept separate.
6. **Use staged load and find the practical boundary.** MotionMark ramps
   complexity toward the point where target frame delivery fails. StillGood
   applies a similar principle to five practical workload levels.
7. **Do not let easy categories hide a weak core.** The overall result uses a
   weighted geometric mean and explicit caps based on the weakest of everyday
   apps, documents, and multitasking.
8. **Validate completed work.** Every deterministic workload produces a
   checksum, playback reports displayed/dropped frames, and storage operations
   must complete before a tier is accepted.
9. **State test conditions.** The export records browser, platform, logical
   processors, display cadence, run duration, profile version, interruptions,
   and raw samples. Power source is deliberately not requested in the primary
   flow; exported results mark it as unreported.

## Test structure

### 1. Everyday browser applications

Five levels—Basic, Everyday, Busy, Demanding, and Extreme—perform deterministic
dataset generation, search, filter, sort, JSON serialization, DOM creation, and
presentation. Each level receives one unscored warm-up and three measured runs.

### 2. Documents and tables

The same workload ladder uses document-oriented text, search, larger table
views, serialization, and presentation. It has slightly wider latency
boundaries than the inbox workload.

### 3. Visual smoothness

Four fixed-complexity canvas workloads run for 1.8 seconds each. Frame delivery
is evaluated relative to the measured display cadence. A frame above 50 ms is
also counted as a long frame.

### 4. Video playback

Local H.264/30 fps clips are played at 480p, 720p, and 1080p. The benchmark
records completion, total frames, dropped-frame ratio, and rebuffering events.
A higher tier is skipped when the preceding tier fails severely.

### 5. Multitasking

Four foreground workload levels run while one to four deterministic Web Workers
remain busy, subject to the device's reported logical concurrency. Each level
receives a pressure warm-up and three measured foreground journeys. The final
level uses eight spaced probes to expose sustained low-power CPU behavior rather
than measuring turbo bursts alone.

### 6. Browser storage and recovery

IndexedDB writes and reads bounded 1 MB, 8 MB, and 32 MB datasets. Results are
explicitly labeled browser-storage responsiveness, not physical-drive
throughput. Temporary data is deleted. The harness then probes event-loop
recovery.

## Tier classification

Latency tiers are classified using their median, worst sample, and variation:

- **Comfortable:** median at or below 200 ms, worst at or below 500 ms, and
  coefficient of variation at or below 45% for everyday apps.
- **Usable:** median at or below 500 ms and worst at or below 1,200 ms.
- **Limited:** completes but exceeds the usable comfort envelope.
- **Failed:** severe delay or inability to complete.

Documents and multitasking use slightly wider published thresholds. Graphics,
video, and storage have domain-specific thresholds stored in the scoring code.
These are initial usability anchors, not a claim of universal scientific
calibration.

## Aggregation and strata

Category weights are:

| Category | Weight |
|---|---:|
| Everyday apps | 26% |
| Documents | 19% |
| Multitasking | 25% |
| Visual smoothness | 11% |
| Video | 12% |
| Browser storage | 3% |
| Recovery | 4% |

The weighted geometric mean reduces compensation between categories. The
weakest core category applies a ceiling to the overall score.

| Score | Grade | Meaning |
|---:|:---:|---|
| 92–100 | A+ | Modern-fast |
| 84–91 | A | Comfortable |
| 76–83 | B+ | Strong second-life |
| 68–75 | B | Useful |
| 58–67 | C+ | Light-use |
| 48–57 | C | Focused-use |
| 35–47 | D | Single-purpose |
| 0–34 | E | Struggling |

The grade is a summary. Tier limits and category results are the primary
product output.

## Integrity and confidence

- A hidden benchmark tab records an interruption.
- Unsupported collectors lower detail rather than creating synthetic data.
- Network transfer and media preparation happen before measurement.
- Raw per-tier repetitions are preserved in the exported JSON.
- High variability, excessive long tasks, or interruptions lower confidence.
- The run stops escalating a latency or video section after a severe failure.

## Calibration requirement

Version 2 is a substantially better measurement instrument, but its thresholds
remain experimental until tested against a physical-device matrix and blinded
human comfort ratings. The first named calibration anchor is:

> HP Chromebook 13 G1, Core m5-6Y57, MX Linux, Chromium, on battery: expected
> B or B+—useful second-life computer, not modern-fast hardware.

Recommended validation includes at least three runs on each reference device,
cool-down between repeated runs where relevant, plugged-in and battery runs for
laptops, and comparison against the users' real-task ratings.

## Research sources

- Speedometer 3 methodology: https://browserbench.org/Speedometer3.0/about.html
- Speedometer 3 design discussion: https://webkit.org/blog/15131/speedometer-3-0-the-best-way-yet-to-measure-browser-performance/
- SPEC CPU 2017 run rules: https://www.spec.org/cpu2017/Docs/runrules.html
- Google Benchmark user guide: https://google.github.io/benchmark/user_guide.html
- BenchmarkDotNet measurement stages: https://benchmarkdotnet.org/articles/guides/how-it-works.html
- MotionMark methodology: https://browserbench.org/MotionMark/about.html
- Long Animation Frames: https://www.w3.org/TR/long-animation-frames/
- Media Capabilities: https://www.w3.org/TR/media-capabilities/
- Dropped video frames: https://developer.mozilla.org/en-US/docs/Web/API/VideoPlaybackQuality/droppedVideoFrames
