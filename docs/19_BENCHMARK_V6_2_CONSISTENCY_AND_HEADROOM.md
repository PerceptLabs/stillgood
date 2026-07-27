# Benchmark v6.2: consistency and headroom

## Decision

StillGood v6.2 keeps the v6.1 workload ladder and adds a second interpretation
layer for intermittent pauses. The benchmark now distinguishes average
capability from consistency and remaining performance reserve.

Profile identifier: `6.2.0-consistency-and-headroom`

## Why this revision exists

Repeated tests on a low-power Chromebook showed acceptable whole-journey
averages while ordinary use still exhibited catch-up pauses. The exported data
already contained action-level timing and hundreds of Long Animation Frame
observations, but v6.1 did not use that evidence in the result.

The same validation showed that the four-state graphics scale could move a
result by an entire grade when a frame-delivery ratio crossed one boundary. An
optional dense visual stress tier could cap otherwise comfortable everyday
work.

## Action-level tail measurement

Each automated search, sort, edit, navigation, formatting, spreadsheet, and
panel action retains:

- total action-to-presentation time;
- synchronous fixture work time;
- presentation time;
- action name and parent workload tier.

Category scoring continues to use repeated complete journeys, but now blends
the journey score with the action-level 95th percentile. Actions above 250 ms
and 500 ms are counted as hitch evidence. This improves granularity without
adding more repetitions or substantially increasing run time.

## Responsiveness consistency

The result includes a separate consistency assessment:

- **Steady**
- **Occasional pauses**
- **Noticeable hitches**
- **Frequent interruptions**

The consistency score uses action latency p50, p75, p95, p99, and worst
observation; the ratio of actions exceeding 250 ms and 500 ms; Long Animation
Frame observations normalized by active test time; and excess blocking duration
when the browser exposes frame durations.

Long Animation Frame evidence is supplementary. Browsers without that API are
not penalized; action timing remains the common cross-browser baseline.

## Preflight stability

After assets and display cadence are prepared, StillGood samples event-loop lag
for approximately two seconds. If the browser is already being delayed, the
warm-up is extended once and the baseline is sampled again.

If the second baseline remains unsettled, the measured result is preserved,
confidence is lowered, and the user is advised to retest after background work
settles. No hidden correction is applied.

## Continuous graphics scoring

Each visual tier now receives a continuous score from:

- 60 fps-normalized on-time delivery: 60%;
- Long Animation Frame ratio: 25%;
- worst repeated frame delay: 15%.

Light, medium, and busy tiers define everyday visual usability. The dense tier
still contributes to the graphics category and performance-reserve evidence,
but it cannot by itself impose an overall-grade cap.

## Performance reserve

The A–E grade remains the primary answer. A separate **Performance reserve**
label describes how much additional workload the device handled:

- Very high
- High
- Moderate
- Limited

This uses adaptive browsing, email, document, and spreadsheet headroom tiers,
plus multitasking and everyday graphics results.

## Result and export changes

The first result view now includes Responsiveness and Performance reserve. The
detailed report uses **Browser-reported platform** rather than implying that
`navigator.platform` identifies the physical CPU architecture.

Exports use schema identifier `stillgood-result.v6.2` and retain preflight
samples, action timings, Long Animation Frame durations, active measurement
time, and the existing workload results.

