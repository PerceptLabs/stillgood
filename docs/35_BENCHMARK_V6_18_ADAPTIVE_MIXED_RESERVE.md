# Benchmark v6.18 — practical speed and mixed reserve

**Profile:** `6.18.0-adaptive-mixed-reserve`
**Schema:** `stillgood-result.v6.18`

This addendum supersedes v6.17.1 scoring aggregation and its repeated
upper-reserve modules. The grade ladder, public result structure, browser
evidence boundary, ordinary fixtures, boundary confirmation, memory ladder,
storage ladder, and video ladder remain in force.

## Calibration problem

Paired Dell workstation, S25-class Android, and HP Chromebook/MX Linux runs
revealed three problems:

1. already-comfortable sub-100 ms work saturated too early;
2. very large isolated tiers and an independent headroom ceiling could count
   capacity twice and reverse broader ordinary-performance evidence; and
3. the upper stage looked like a replay of the benchmark instead of a distinct
   test of overlapping work.

## Decisions

- Continuous latency keeps useful anchors at 30, 50, and 80 ms.
- Each application category is 78% ordinary responsiveness and 22% adaptive
  capacity.
- The overall geometric mean emphasizes browsing, office, multitasking, and
  response consistency. Video is a capability result and a 4% overall input,
  not a proxy for general computer speed.
- Aggregate headroom uses a smooth `headroom + 12` ceiling. There is no
  one-point gate cliff.
- The final reserve qualifier is High confidence, preliminary score ≥89,
  headroom ≥83, and every core category ≥86, subject to measured memory and
  storage gates.
- The reserve stage overlaps demanding web and office journeys with workers,
  retained memory, persistent save activity, 1080p video, and a Canvas photo
  edit for about 12 seconds.
- Its score uses loaded p95 response (40%), slowdown from the ordinary-action
  baseline (32%), worst tail (18%), and frame delivery (10%) in a weighted
  geometric mean.
- Its final ceiling is `reserve + 7`, bounded from 87 through 100; there is no
  multi-point threshold jump inside the reserve result.
- Temporary reserve memory and storage evidence is isolated from the ordinary
  category scores.
- A completed run without mixed-reserve evidence is capped at 87/B+. This is a
  strong second-life result, not a failure.
- A− computer wording is “Excellent second-life computer.” The modern-feeling
  claim begins at A.

## Reference replay

The same three latest v6.17.1 evidence payloads replay as:

| Device class | v6.17.1 | v6.18 replay |
|---|---:|---:|
| Dell Windows workstation | 96/A | 95/A |
| S25-class Android | 97/A | 93/A− |
| HP Chromebook/MX Linux | 91/A− | 87/B+ |

No device, operating-system, core-count, RAM-count, or browser-identity offset
is used. The Dell leads because its measured browsing, email, documents,
spreadsheets, and multitasking evidence is stronger. Android retains its real
graphics and video wins. The HP remains a strong, adequate second-life
computer but does not inherit a modern-performance label without the final
reserve evidence.

## Research basis

The design follows representative journeys and repeated iterations from
Speedometer, adaptive difficulty and confidence treatment from MotionMark,
warm/steady/worst behavior reporting from ARES-6, and geometric aggregation
principles used by PCMark. StillGood adapts those practices to usability and
capability reporting rather than browser-engine ranking.
