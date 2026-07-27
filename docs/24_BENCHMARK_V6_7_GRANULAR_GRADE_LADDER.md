# Benchmark v6.7 — Granular grade ladder

**Profile identifier:** `6.7.0-granular-grade-ladder`  
**Result schema:** `stillgood-result.v6.7`

## Purpose

The continuous 0–100 score already separated devices correctly, but the v6.6
letter bands were too broad. A score of 70 received C+ while 87 received B,
making a 17-point difference appear to be only one adjacent grade.

Version 6.7 changes presentation granularity only. It does not change a
workload, measurement, category weight, normalization curve, score cap,
practical penalty, or continuous score.

## Grade ladder

| Score | Grade | Meaning |
|---:|:---:|---|
| 98–100 | A+ | Modern-fast |
| 94–97 | A | Fast |
| 90–93 | A- | Very capable |
| 86–89 | B+ | Strong second-life |
| 82–85 | B | Comfortable second-life |
| 78–81 | B- | Useful second-life |
| 74–77 | C+ | Capable light-use |
| 68–73 | C | Light-use |
| 58–67 | C- | Focused-use |
| 45–57 | D | Single-purpose |
| 0–44 | E | Struggling |

## Reference-result interpretation

Applying the new labels to the four v6.6 reference scores gives:

| Reference result | Score | v6.7 grade |
|---|---:|:---:|
| Dell workstation | 98 | A+ |
| HP Chromebook, plugged-in run | 87 | B+ |
| HP Chromebook, battery run | 82 | B |
| Lenovo Chromebook | 70 | C |

The measurement evidence and practical guidance remain more important than the
letter. In particular, the Lenovo result continues to call out intermittent
catch-up pauses and slow large-file saves.
