# Benchmark v6.12 — Firefox reference calibration

**Profile identifier:** `6.12.0-firefox-reference-calibration`
**Result schema:** `stillgood-result.v6.12`
**Calibration profile:** `firefox-reference-v1.0`

## Why this replaces the earlier rules

Versions 6.10 and 6.11 used narrowly gated scoring exceptions for two Firefox
patterns. Those rules were useful diagnostics, but they were conditional
post-score corrections rather than a coherent normalization model.

Established browser benchmarks do not add browser bonuses. They equalize work,
repeat measurements, reject invalid observations, and report the tested
browser-and-device combination. Some suites also express results relative to a
fixed calibration system. StillGood has a different product goal: it presents a
general computer grade while still exposing the tested browser's practical
behavior. Version 6.12 therefore uses an explicit Firefox-to-reference
calibration for the computer grade and keeps raw Firefox evidence in the report.

## Frozen reference

Chromium is the reference path. Version 6.12 does not transform Chromium
graphics, reserve, workloads, thresholds, weights, caps, or grades. Identity
factors of 1.0 are recorded in every Chromium result.

The Firefox calibration is applied before the final weighted grade and only to
two dimensions that showed stable paired-browser bias:

- graphics score and everyday graphics score;
- aggregate adaptive headroom.

Browsing, email, documents, spreadsheets, multitasking, video, memory,
storage, responsiveness, recovery, grade bands, and practical penalties are
not normalized.

## Provisional factors

The first profile uses the geometric mean of matched ratios from the HP
second-life laptop and Dell workstation:

| Evidence | HP reference ratio | Dell reference ratio | Firefox factor |
|---|---:|---:|---:|
| Graphics score | 89 / 84 | 100 / 93 | 1.067367 |
| Everyday graphics | 98 / 89 | 100 / 96 | 1.070983 |
| Headroom | 86 / 78 | 92 / 85 | 1.092412 |

Multiplicative calibration preserves ordering and proportional differences
better than a flat point bonus. Every normalized value is clamped to 0–100.

The factors are provisional because two paired systems are not enough for
publication-grade calibration. The profile records `calibrationPairs: 2`.
Additional paired Firefox and Chromium runs should be used to expand the
calibration set, calculate uncertainty, and validate the factors on held-out
devices before calling them final.

## What remains visible

The exported result contains:

- the raw Firefox graphics and headroom scores;
- the normalized values used for the computer grade;
- every applied factor;
- the calibration profile and pair count;
- all raw tier timings and browser identification.

The detailed capability report continues to describe raw browser-visible
limitations. A weak Firefox graphics run therefore remains a warning even when
the general computer grade uses calibrated evidence.

## Replay

| Run | Raw/reference result | v6.12 computer grade |
|---|---:|---:|
| Dell Chromium | A+ 98 | A+ 98 |
| Dell Firefox | B+ 87 before calibration | A 96 |
| HP Chromium | B+ 87 | B+ 87 |
| HP Firefox | B 85 before calibration | B+ 87 |
| Other Chromium reference run | C 71 | C 71 |
| Lenovo Firefox | C- 63 before calibration | C- 63 |

The Lenovo does not receive a broad exemption. Its raw graphics result moves
only from 28 to 30 for grade evidence and its raw warning remains. This
preserves the large practical difference between it and the HP.

## Integrity requirements

Future Firefox calibration profiles must:

1. be derived from matched physical-device runs;
2. use a monotonic transformation;
3. publish the raw and transformed evidence;
4. state the number and range of calibration devices;
5. be validated on devices not used to fit the factors;
6. create a new benchmark profile when factors change;
7. leave the Chromium reference path unchanged.
