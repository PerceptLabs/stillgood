# Benchmark v6.17: upper-reserve confirmation

**Status:** Authoritative addendum  
**Profile:** `6.17.0-upper-reserve`  
**Result schema:** `stillgood-result.v6.17`

## Decision

StillGood adds an adaptive upper-reserve stage for clean preliminary results
that would otherwise occupy the top A-level grade bands. The stage makes the
fastest devices demonstrate sustained capacity instead of earning the same
result from short everyday bursts.

This revision does not change the ordinary path for older or midrange devices.
It does not use device type, processor name, core count, browser family, or an
assumed RAM-to-core relationship to alter a score.

## Entry gate

The stage runs only when all of the following are true:

- confidence is High;
- the preliminary score is at least 94;
- aggregate ordinary headroom is at least 88;
- browsing, email, writing, spreadsheets, and multitasking each score at
  least 88;
- measured memory evidence remains eligible for a top grade; and
- persistent storage scores at least 88 when that module is available.

Failing the gate means the benchmark finishes normally. Skipping the stage is
not a penalty.

## Work performed

The upper-reserve stage adds:

| Area | Sustained evidence |
|---|---|
| Browsing | 400,000-record working dataset and a 360-node visible fixture |
| Email | 750,000-record inbox dataset and a 300-node visible fixture |
| Documents | 750,000-record document data and a 7,500-node layout fixture |
| Spreadsheets | 4,000,000-cell data preparation and a 140-node visible table |
| Multitasking | 10 seconds of foreground journeys with up to four busy workers |
| Visuals | 7 seconds at dense complexity, with worker pressure when available |
| Memory | touched WebAssembly working sets extended to 1,792 and 2,048 MB |
| Persistent save | 256 MB OPFS write, flush, reopen, random read, and verification |
| Recovery | foreground probes until response returns to the normal baseline |

Dataset preparation is included in the office measurements. Each office
fixture receives a warm pass followed by three measured repetitions. A failed,
aborted, invalid, or unverifiable reserve tier is retained as explicit evidence
rather than silently omitted.

## Scoring

Ordinary tiers continue to determine everyday capability. The upper-reserve
score is a separate weighted geometric mean:

| Component | Weight |
|---|---:|
| Multitasking | 25% |
| Visuals | 13% |
| Memory | 12% |
| Persistent save | 10% |
| Browsing | 8% |
| Email | 8% |
| Documents | 8% |
| Spreadsheets | 8% |
| Recovery | 8% |

The geometric mean prevents one exceptional component from hiding a weak one.
The result applies only an upper grade ceiling:

| Upper-reserve score | Maximum final score |
|---:|---:|
| 94–100 | 100 |
| 88–93 | 97 |
| 80–87 | 96 |
| 70–79 | 95 |
| 60–69 | 94 |
| Below 60 | 92 |

The existing weighted evidence may also lower the result naturally. The
upper-reserve rule never raises a score.

## Interpretation

This stage distinguishes three ideas that should not be conflated:

- everyday speed: ordinary work feels quick;
- headroom: larger normal workloads remain usable; and
- sustained reserve: unusually large overlapping work remains stable.

A fast phone can therefore remain excellent for its tested uses while a
workstation earns more separation through greater sustained reserve. The report
must describe the observed strength or limit in practical terms and must not
claim exact installed memory or native-application performance.

## Safety and comparability

The largest memory and storage steps are bounded and only run after the strict
entry gate. Allocation success alone is not evidence of physical RAM. The test
requires touched and revisited data, foreground probes, integrity verification,
and recovery. Cross-device comparisons should use the same benchmark profile,
browser family, power policy, thermal condition, and extension setup.
