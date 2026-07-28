# Benchmark v6.8 — Browser-neutral media and headroom

**Profile identifier:** `6.8.0-browser-neutral-media-and-headroom`
**Result schema:** `stillgood-result.v6.8`

## Purpose

Paired Firefox and Chromium runs on the same HP Chromebook and Dell
workstation revealed two cross-browser interpretation problems:

1. Firefox emitted one brief `waiting` event during every local video tier even
   though it dropped no frames and advanced nearly the complete measurement
   interval. Counting events rather than their duration reduced video from 100
   to 68.
2. Extended and maximum email tiers correctly revealed browser-engine reserve,
   but their aggregate category score also triggered the hard minimum intended
   for ordinary activity. A Dell workstation and an old Chromebook consequently
   converged on the same overall score in Firefox.

Version 6.8 corrects both issues without checking the browser name or applying a
browser-specific bonus.

## Video rule

The runner retains the raw count of post-start `waiting` events but also records:

- cumulative waiting duration;
- longest individual waiting duration;
- media-time advancement;
- delivered and dropped frames;
- completion and measurement source.

Classification:

| Status | Dropped frames | Total waiting | Longest wait |
|---|---:|---:|---:|
| Comfortable | ≤1% | ≤100 ms | ≤100 ms |
| Usable | ≤5% | ≤500 ms | ≤350 ms |
| Limited | ≤12% | ≤1,500 ms | ≤1,000 ms |
| Failed | Outside these limits or incomplete | | |

This is browser-neutral. A Chromium run with no waiting remains unchanged. A
brief Firefox lifecycle event is accepted only when the measured duration,
frame delivery, and media progress agree that playback remained smooth.

## Everyday capability rule

Each latency category now exposes:

- `score`: all completed tiers, including adaptive reserve;
- `everydayScore`: normal through demanding tiers, excluding `headroom` and
  `limit`.

The weighted overall evidence continues to use the complete category score.
Performance reserve continues to use extended and maximum tiers. Only the hard
core-capability minimum uses `everydayScore`.

This preserves the cost of poor reserve while preventing an intentionally
oversized workload from being described as ordinary email, document, or web
performance.

## Expected paired-run effect

Replaying the reference evidence gives the following expected direction:

| Combination | v6.7 | v6.8 expectation |
|---|---:|---:|
| Dell Chromium | A+ 98 | unchanged |
| HP Chromium | B+ 87 | unchanged |
| Lenovo Chromium | C 70 | unchanged |
| Dell Firefox | B 83 | approximately B+ 87 |
| HP Firefox | B 83 | approximately B 84 |

Exact v6.8 results require a fresh run because earlier reports did not record
waiting-event duration.

## Non-goals

- No user-agent sniffing.
- No Firefox-specific thresholds.
- No removal of adaptive headroom.
- No change to the v6.7 grade ladder.
- No claim that browser results equal native desktop-application performance.
