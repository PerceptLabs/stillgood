# StillGood v7 shadow scoring experiment

**Status:** Experimental; not shown to users and does not change the public score  
**Shadow version:** `7.0.0-shadow.1`  
**Public benchmark while this is evaluated:** `6.24.0-calibrated-top-range`

## Why this exists

StillGood's public 0-to-100 score is intentionally easy to read, but its current
normalized category curves become crowded once ordinary work is comfortable.
Keeping an extra decimal place inside that bounded scale preserves rounding
precision; it does not create enough measurement range to distinguish an older
adequate computer from a substantially faster workstation.

The v7 experiment tests a different model. It retains raw performance ratios
and workload-capacity estimates before any future translation into a friendly
public score. An index of 1000 is a reference point, not a maximum. A result of
2000 means twice the measured performance on that dimension under the stated
model; values above 2000 remain possible.

This follows a long-established benchmark pattern. SPEC reports reference time
divided by measured time and combines workload ratios with a geometric mean.
WebXPRT likewise reports scenario performance relative to a calibration system.
MotionMark complements fixed work with adaptive capacity. StillGood combines
those ideas while preserving its own practical comfort thresholds and workload
descriptions.

## Three distinct questions

The shadow system does not ask one measurement to answer everything.

1. **How quickly does fixed everyday work finish?**
   The same ordinary browsing, email, document, spreadsheet, and multitasking
   tiers run on every completing device. Each tier produces a ratio from measured
   median and worst repeated journey time to a versioned reference time.
2. **How much useful work remains comfortable?**
   The increasing workload ladder estimates the point where typical or worst
   response crosses the category's comfort boundary. Log interpolation locates
   that point between the last comfortable tier and the first overloaded tier.
3. **How much performance remains when work overlaps?**
   Every reserve-qualified device receives the same standard pressure level:
   two workers, a 512 MB live browser working set, a verified 64 MB save, video,
   and advanced application work. Foreground response, tail delay, slowdown,
   frame delivery, advanced throughput, and advanced latency become independent
   reference ratios.

These are reported separately because fast completion, large capacity, and
resilience under pressure are related but not interchangeable.

## Fixed-work category index

For each ordinary tier:

```text
median_ratio = comfortable_median / measured_median
worst_ratio  = comfortable_worst / measured_worst
tier_ratio   = geometric_mean(median_ratio ^ 0.70,
                              worst_ratio  ^ 0.30)
```

The five ordinary tier ratios are combined with increasing weights of 12%, 16%,
20%, 24%, and 28%. Larger realistic workloads therefore carry more evidence,
without erasing performance on basic actions.

The first provisional reference times are category comfort anchors rather than
a secretly selected hardware winner. Calibration against physical devices may
replace them with a named reference device or reference corpus before v7 can
become public.

## Comfortable-capacity index

Each workload tier has a size, such as rows, messages, document content, or
fixture complexity. A tier's effective load is the worse of:

```text
measured_median / comfortable_median
measured_worst  / comfortable_worst
```

Effective load is made monotonic as size rises so a lucky larger observation
cannot imply that the device regained lost capacity. The capacity estimate is
the log-interpolated workload size where effective load reaches 1.0.

If every measured tier stays comfortable, StillGood reports the largest tested
size as an explicit lower bound and marks the ceiling open. It does not invent
an unmeasured limit. If the smallest tier is already overloaded, the estimate
falls below that tier in proportion to the observed load.

The category index combines 65% fixed-work ratio and 35% capacity ratio with a
geometric mean. This balance is provisional and will be checked against physical
device evidence before it affects public results.

## Standard pressure index

The standard pressure workload is deliberately fixed so comparisons are not
confounded by one device receiving more work than another. Its provisional
component weights are:

| Component | Weight | Reference evidence |
|---|---:|---:|
| Foreground 95th-percentile latency | 32% | 100 ms |
| Worst repeated foreground latency | 13% | 250 ms |
| Loaded/unloaded slowdown | 10% | 2.8x |
| On-time frame delivery | 5% | 90% |
| Advanced-work throughput | 27% | 30 iterations |
| Advanced-work 95th-percentile latency | 13% | 450 ms |

Each component is a reference-to-measured ratio, and the available ratios are
combined geometrically. The optional higher pressure level is kept separate;
it is never substituted for the standard comparison.

## Provisional system index

The current shadow system index combines 75% web-work index and 25% standard
pressure index geometrically. When pressure evidence is unavailable, coverage
is labeled `web-only` and the web index is retained rather than fabricating the
missing observation.

The system index is research data, not a public grade. No mapping from this index
to StillGood's public 0-to-100 score has been approved.

## Validation and promotion criteria

Before this model can change public results, it must:

- preserve the ordering seen in repeated physical-device comparisons;
- distinguish visibly hitchy devices from consistently responsive devices;
- retain meaningful distance between an adequate old computer and a workstation;
- remain stable across clean repeat runs and avoid threshold cliffs;
- keep Chromium behavior unchanged by Firefox-specific compatibility work;
- expose missing evidence and open ceilings instead of converting them into
  hidden bonuses or penalties;
- survive versioned replay against a larger anonymous run corpus;
- have its reference values, weights, and uncertainty policy published.

During the shadow period the experimental summary is included in an exported
result. If anonymous measurement sharing is enabled, a tightly allowlisted copy
of the indices, capacities, brackets, and pressure components is also submitted.
Raw observation details remain in the local/exported report; the shadow system
does not collect any new identity or hardware-inventory fields.

## Research basis

- [SPEC CPU 2026 run rules](https://ftp.spec.org/cpu2026/docs/runrules.html) -
  reference-time ratios, repeated runs, medians, and geometric aggregation.
- [WebXPRT 4 results calculation](https://www.principledtechnologies.com/benchmarkxprt/counter.php?inline=true&redirect=%2Fbenchmarkxprt%2Fwhitepapers%2Fwebxprt%2FWebXPRT-4-results-calculation.pdf) -
  scenario ratios to a calibration system, geometric means, and confidence.
- [MotionMark methodology](https://browserbench.org/MotionMark/about.html) -
  adaptive workload complexity and performance thresholds.
- [Speedometer methodology](https://browserbench.org/Speedometer3.1/about.html) -
  repeated, application-shaped browser work and aggregate responsiveness.
