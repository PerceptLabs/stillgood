# Fast Check Research Decision

**Decision date:** 2026-07-24  
**Status:** Authoritative for the Fast Check experience

## Decision

StillGood will present one primary test lasting approximately 20–30 seconds on
a supported computer. The user sees five practical checks:

1. Everyday work
2. Documents and search
3. Motion and video
4. Multitasking
5. Browser storage and recovery

The interface does not expose a count of micro-actions. Repetitions and workload stages are implementation details.

## Why 28 fixed actions is not optimal

Action count is not a validity target. Twenty-eight actions can all measure the same animation-frame boundary, as the first prototype demonstrated. Conversely, a smaller number of complete, representative journeys can exercise more useful work.

Speedometer’s project principles favor end-to-end user journeys over tight feature loops and explicitly balance broad real-world coverage with relatively quick execution. Its current default configuration contains 20 default-tagged suites, multiple steps per suite, and 10 iterations; the simple public experience does not ask users to reason about those counts.

StillGood has a different job. It is not comparing browser engines with a single throughput score. It needs enough evidence to place a computer into practical capability bands. Five distinct checks with staged work and repeated measurements provide more useful coverage than a fixed list of 28 visually similar actions.

## Duration target

- Typical supported computer: 20–30 seconds
- Slow computer: no more than 45–60 seconds
- Severe slowdown: stop escalation early and report the practical limit
- Preparation and first network download are excluded from scoring

This duration allows two measured samples at each relevant workload tier while remaining short enough for casual users and refurbisher intake.

## Measurement structure

### Everyday work and documents

Use fixed, versioned workload tiers. Alternate inbox, search, sort, document edit, and table operations. Record synchronous work separately from presentation completion so refresh cadence does not become the score.

### Motion and video

Calibrate display cadence, record late frames relative to that cadence, and play a cached local video. Report video frame drops separately from interface smoothness.

### Multitasking

Use one to four workers based on available logical concurrency, leaving the foreground thread responsive. Continue fixed foreground journeys while workers run. Measure pressure response and recovery.

### Browser storage

Write and read a bounded local dataset, clean it up, and label the result browser storage responsiveness rather than disk speed.

## Repetition policy

- Two measured samples per fixed workload tier in Fast Check
- A third sample only when the first two disagree materially
- Warm-up is unscored
- Stop escalating after severe delay
- Preserve p75, p95, worst repeated delay, variation, and raw samples

Adaptive repetition is preferable to always running the same count. It spends time where uncertainty exists instead of repeating an obvious pass or failure.

## Result policy

Lead with one sentence:

> Comfortable for everyday work and light multitasking. Video is smooth. Heavy browser multitasking is the first limit.

Then show five check outcomes and the highest comfortable/usable workload. Keep the A–E grade as a compact summary.

When every workload remains below the measurement floor, report:

> Above this test’s current ceiling

Do not present an unexplained 100/100.

## Research basis

- Speedometer repository and measurement principles: https://github.com/WebKit/Speedometer
- Speedometer 3.1 test instructions: https://www.browserbench.org/Speedometer3.1/instructions.html
- Interaction to Next Paint thresholds: https://web.dev/articles/inp
- Long Animation Frames specification: https://www.w3.org/TR/long-animation-frames/
