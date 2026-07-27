# StillGood Benchmark v6.4: Practical Grade Ladder

**Profile:** `6.4.0-practical-grade-ladder`  
**Result schema:** `stillgood-result.v6.4`  
**Status:** Authoritative

Version 6.4 keeps all v6.3 measurements, workloads, continuous scores,
headroom constraints, authenticated history, and raw data. It changes the
grade ladder so an A clearly means performance comparable to a fast modern
browser computer—not merely that an older computer remains comfortable for
ordinary work.

## Why the grade ladder changed

The HP Chromebook calibration run earned an index of 92 because ordinary
interactions were genuinely responsive: its action p95 was below 80 ms, common
workloads were comfortable, 1080p H.264 playback dropped no frames, and it
recovered promptly. It therefore should not be described as slow or marginal.

The same run exposed clear limits. Maximum browsing and writing tiers took
roughly 600–700 ms and the dense visual tier was limited. Calling that result
an A implied parity with the modern-fast systems that retained more reserve.
The measurement index was useful; the letter mapping was too generous.

## Current grade bands

| Index | Grade | Meaning |
|---:|:---:|---|
| 98–100 | A+ | Modern-fast |
| 95–97 | A | Fast |
| 88–94 | B+ | Comfortable second-life computer |
| 78–87 | B | Useful everyday computer |
| 68–77 | C+ | Light-use computer |
| 58–67 | C | Focused-use computer |
| 45–57 | D | Single-purpose computer |
| Below 45 | E | Struggling with ordinary browser work |

The index is a benchmark index, not a percentage or a school grade. The main
result leads with the practical label and capability explanation. Saved
history identifies the number as an index.

Saved-run summaries apply the current grade ladder to their stored index so an
older 92-point run appears as B+ in history. Downloaded JSON remains an
unaltered record of the profile that originally produced it.

## Known-device calibration

Regrading the current captured scores produces:

| Device profile | Index | v6.4 result |
|---|---:|---|
| Dell workstation | 98 | A+ — Modern-fast |
| AMD laptop | 96 | A — Fast |
| HP Chromebook 13 G1 | 92 | B+ — Comfortable |
| Lenovo ARM Chromebook with catch-up pauses | 75 | C+ — Light-use |

No device receives a penalty for its manufacture date, processor branding,
power class, or operating system. Two devices with the same measured behavior
receive the same result. The stricter bands only change what each level claims.

## Product wording

- A+ may say the browser feels modern.
- A may say the computer is fast for everyday browser work.
- B+ says it is comfortable for everyday use with limits under heavier work.
- B says it is a genuinely useful second-life computer.
- C grades emphasize lighter or focused work.

This wording prevents a useful old computer from being dismissed while
preserving a meaningful gradient up to modern desktop performance.
