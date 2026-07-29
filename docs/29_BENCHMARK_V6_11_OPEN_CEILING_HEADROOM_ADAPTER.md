# Benchmark v6.11 — Telemetry-limited open-ceiling headroom adapter

**Profile identifier:** `6.11.0-telemetry-limited-open-ceiling-adapter`
**Result schema:** `stillgood-result.v6.11`

## Problem

A paired workstation run exposed a discontinuity in the general reserve rule.
Chromium measured a headroom score of 92 and retained its 98-point base result.
Firefox measured 85. Although Firefox completed all four maximum reserve tiers,
the general rule imposed a hard maximum of 87 on every headroom result below
88. One point above that boundary could therefore preserve a mid-90s result
while one point below it could force B+.

That cliff was useful for genuinely limited older-device profiles, but it was
too severe when all ordinary work scored at or near 100 and the adaptive test
never found the computer's limit.

## Adapter

The hard B+ ceiling is replaced by the existing proportional reserve cap only
when every condition below is true:

- both Long Tasks and Long Animation Frames telemetry are unavailable;
- the lowest everyday core score is at least 96;
- all four adaptive categories reached their maximum test tier;
- all four maximum tiers remained at least usable;
- the calculated headroom score is from 78 through 87.

The result remains capped at `headroom + 7`. Reserve therefore still matters,
but it cannot create the eight-point threshold cliff. The adapter does not
change workload execution, category scores, headroom measurements, grade
boundaries, or Chromium's full-telemetry path.

## Paired workstation replay

| Run | v6.10 | v6.11 replay | Reason |
|---|---:|---:|---|
| Chromium | A+ 98 | A+ 98 | Full-telemetry path is unchanged |
| Firefox | B+ 87 | A- 92 | Headroom 85 applies a proportional 92 cap |

Firefox remains below Chromium because its browsing and email reserve tiers
were slower. The adapter removes only the discontinuous hard ceiling; it does
not make the browser results equal.

## Older-device safeguards

Replaying the earlier physical-device evidence produced:

| Device and browser | v6.11 replay | Open-ceiling adapter |
|---|---:|---|
| Lenovo Chromium | C 71 | No |
| HP Firefox | B 85 | No |
| HP Chromium | B+ 87 | No |
| Lenovo Firefox | C 73 | No |

The HP Firefox run reached only one open ceiling. The Lenovo Firefox run had a
core minimum of 81 and one open ceiling. Neither can qualify. The separate
v6.10 isolated-graphics rule remains responsible for the Lenovo Firefox
graphics treatment.

## Integrity

The rule is capability-gated and evidence-gated. It contains no browser name,
user-agent match, flat point bonus, or multiplier. A browser with complete
telemetry cannot enter this path, so current Chromium results are unchanged.
