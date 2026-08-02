# Benchmark v6.17.1: headroom continuity correction

**Status:** Authoritative correction  
**Profile:** `6.17.1-headroom-continuity`  
**Result schema:** `stillgood-result.v6.17.1`

## Observed defect

Physical-device runs exposed two interacting aggregation errors in v6.17.0:

1. when headroom was below 88, the score was capped at the smaller of
   `headroom + 7` and 87; and
2. upper-reserve tiers were added to ordinary category and headroom summaries
   before the separate upper-reserve ceiling was applied.

The first rule collapsed headroom scores of 82, 84, and 87 to the same final
score of 87. The second counted upper-reserve evidence twice and could make a
device score lower merely because it qualified for the harder extension.

## Corrected policy

- The fixed 87 shelf is removed for every device.
- Ordinary headroom below 88 retains a continuous ceiling of
  `round(headroom + 7)`.
- Headroom scores of 82, 84, and 87 therefore permit final scores of 89, 91,
  and 94 respectively.
- Upper-reserve tiers remain visible in detailed evidence but are excluded
  from ordinary category, headroom, graphics, responsiveness, variability,
  confidence, and core-capability aggregation.
- Upper-reserve evidence influences the final score once through its dedicated
  weighted geometric score and grade ceiling.
- An invalid upper-reserve visual tier remains a zero-valued reserve component,
  but it no longer invalidates ordinary visual evidence.

## Stable reserve entry

The upper-reserve headroom gate changes from 88 to 87 while the other strict
requirements remain unchanged: High confidence, a preliminary score of at
least 94, every core category at least 88, top-grade-eligible memory evidence,
and storage of at least 88 when available.

This one-point buffer prevents a one-point headroom fluctuation from making an
otherwise top result unpredictably skip the extended stage. The core-category
gate continues to keep ordinary second-life devices out of the extension.

## Repetition statistics

Upper-reserve dataset preparation remains timed and exported as `setupMs`,
`setupWorkMs`, and `setupPresentationMs`. It is no longer inserted as though it
were another repeated interaction journey. Only the three like-for-like
journeys determine interaction median, tail, and coefficient of variation.
This prevents unlike setup and interaction timings from manufacturing false
35–56% variation.

## Scope

No workload sizes, ordinary thresholds, category weights, browser treatment,
memory limits, storage limits, or grade bands change in this correction. The
change repairs aggregation and entry stability; it does not give any browser
or device class a score adjustment.
