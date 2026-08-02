# Benchmark v6.19: paired reserve and repeatability

**Profile:** `6.19.0-paired-reserve-repeatability`
**Schema:** `stillgood-result.v6.19`

Version 6.19 preserves the v6.18 grade ladder, ordinary-category weighting,
headroom ceiling, and public result design. It corrects two specific sources of
ambiguity found in physical Lenovo, HP, phone, and workstation runs.

## Paired reserve evidence

The reserve stage no longer compares loaded demanding work with a pooled
baseline from different ordinary tiers. It now:

1. initializes the DOM, Canvas, and related execution paths without scoring;
2. runs fixed demanding browsing, email, document, spreadsheet, and image-edit
   journeys unloaded;
3. repeats the same datasets, seeds, actions, and repetition count while
   controlled video, compute, memory, and storage pressure overlap; and
4. scores both absolute loaded latency and the paired slowdown.

Loaded response uses a deliberately granular upper curve. Sixteen and 27
milliseconds are both excellent, but they no longer collapse into the same
perfect score.

Only a standard level with loaded p95 at or below 55 ms, worst latency at or
below 125 ms, slowdown no greater than 1.45x, and at least 95% on-time frame
delivery enters the higher level. The higher level uses four workers, a larger
bounded working set, a 128 MB persistent save, and higher-resolution video.
Standard evidence contributes 65% of reserve scoring; the higher level
contributes 35%. Devices that do not qualify are not penalized for skipping it.

## Cold and steady observations

Canvas, WebAssembly, IndexedDB, and OPFS paths receive untimed initialization.
For each full-size OPFS tier, the first observation is retained as a cold
diagnostic and the following observations determine steady scoring. A severe
cold flush can produce a small practical caution, but shared OPFS evidence is
not penalized independently through both the storage score and large-save
score.

This treatment keeps real catch-up stalls visible without allowing one startup
event to dominate every subsequent operation.

## Local repeatability range

The result compares the current score with up to four locally saved results
from the same profile, browser family, platform, and logical-processor count.
Two or more comparable results establish a range. A span greater than five
points is labeled variable performance and users are told to interpret the
range rather than one point.

The range is stored locally, is excluded from anonymous telemetry, and never
changes the score.

## Scoring invariants

- Ordinary category scores and grade thresholds are unchanged.
- The reserve stage may cap a result but never raise it.
- Headroom remains a smooth ceiling.
- Browser names do not select score offsets or alternate thresholds.
- Cold observations remain exportable evidence.
- The higher reserve level is conditional and visually described as an
  escalation, not a replay of the main benchmark.
