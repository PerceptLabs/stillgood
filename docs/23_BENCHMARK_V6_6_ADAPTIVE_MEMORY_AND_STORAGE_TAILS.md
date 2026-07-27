# Benchmark v6.6 — Adaptive memory and storage tail latency

**Status:** Implemented experimental profile  
**Profile identifier:** `6.6.0-adaptive-memory-and-storage-tails`  
**Result schema:** `stillgood-result.v6.6`

## Purpose

Version 6.6 corrects two limitations exposed by physical-device calibration:

- the v6.5 memory ladder was too small to distinguish an 8 GB second-life
  computer from a faster system; and
- equal averaging allowed fast small storage operations to conceal a much
  slower large persistent-file flush.

The HP Chromebook completed its largest v6.5 flush in approximately 119 ms.
The Lenovo Chromebook took approximately 678 ms. Version 6.5 reported nearly
identical overall storage scores, which understated a user-visible difference.

## Cross-browser policy

The primary memory and storage workloads use typed arrays, dedicated workers,
IndexedDB, and OPFS synchronous access handles. These are feature-detected and
work in current Chromium and Firefox.

`navigator.deviceMemory` is used only when available to choose a safe maximum.
Firefox does not need to expose it: a conservative desktop or mobile ladder is
used instead. `measureUserAgentSpecificMemory()` is not required or scored
because it is experimental, requires cross-origin isolation, and is not
consistently available across browsers.

## Expanded memory method

Desktop working sets now grow adaptively to 768 MB or 1,024 MB where
appropriate. Mobile systems use lower limits. Every page is committed, then a
dedicated worker repeatedly reads and writes the active set at a 64-byte stride
while the foreground records timer delay.

The module reports:

- allocation and page-commit time;
- sustained scanned megabytes and observed sweep rate;
- foreground 95th-percentile and worst delay;
- copied-buffer overhead; and
- the highest comfortable active set.

Severe delay or allocation failure ends the ladder early. Retained memory is
released after the module.

The result remains a browser workload measurement. It does not claim exact RAM
capacity, native RAM bandwidth, swap usage, or system-wide free memory.

## Expanded persistent-storage method

Desktop OPFS tiers are 16, 64, and 128 MB. Mobile tiers are 8, 32, and 64 MB.
Each tier performs one unscored warm-up and three scored repetitions.

Each repetition:

1. generates deterministic non-empty data;
2. truncates and writes the temporary OPFS file;
3. explicitly flushes it;
4. closes and reopens it;
5. performs seeded random reads;
6. verifies the returned byte count, file size, and sampled contents; and
7. deletes temporary data after the tier.

Foreground delay is measured while storage work runs. IndexedDB strict
transactions also receive unscored warm-up commits.

## Tail-aware scoring

Persistent-file tiers score:

- sequential write behavior: 15%;
- 95th-percentile flush delay: 40%;
- worst flush delay: 15%;
- random-read latency: 10%; and
- foreground delay during storage: 20% when available.

The largest completed file receives 50% of the OPFS subscore. Storage sources
are combined as 15% bulk browser data, 30% small durable saves, and 55%
persistent-file behavior.

Large flush delay also creates explicit grade constraints:

- over 500 ms: maximum B+;
- over 1,000 ms: maximum C+;
- over 2,000 ms: maximum C.

Memory and storage no longer raise the performance-reserve score merely by
being fast. They act principally as negative evidence: poor measured behavior
can reduce or cap the result, while a perfect optional module cannot turn an
older low-reserve computer into a modern-fast one.

## Result presentation

The result-at-a-glance and detailed report now include **Large saves** with one
of these plain-language outcomes:

- Responsive
- Brief pause
- Noticeable pause
- Slow
- Not verified

When a large flush takes at least 500 ms, the report explains that small jobs
should remain fine but saving or updating a large offline file may visibly
interrupt the computer before it catches up.

