# StillGood Benchmark v6.3: Calibrated Headroom and Private Run History

**Profile:** `6.3.0-calibrated-headroom-and-history`  
**Result schema:** `stillgood-result.v6.3`  
**Status:** Authoritative for the current internal deployment

This addendum keeps the v6.2 workloads, action-tail measurements, preflight
checks, 60 fps display normalization, and practical reporting. It corrects a
score-saturation error in adaptive headroom and adds authenticated, automatic
storage for complete benchmark logs.

## Why the scoring changed

In v6.2, reaching the final adaptive tier with a `usable` result was treated as
an open ceiling and assigned a perfect headroom score. That erased meaningful
differences between a low-power computer that completed the tier with little
reserve and a workstation that completed it comfortably.

Version 6.3 follows these rules:

1. The last measured adaptive tier keeps its continuous score.
2. Completing the last tier comfortably may add at most two points.
3. Merely completing it as usable never becomes 100.
4. The A+ / Modern-fast band starts at 95 rather than 92.
5. If headroom is below 88, the overall result cannot exceed headroom plus
   seven points. This prevents excellent light-work timing from concealing a
   much lower sustained-work ceiling.

The performance-reserve labels are:

| Headroom score | Label |
|---:|---|
| 90–100 | Very high |
| 78–89 | High |
| 54–77 | Moderate |
| Below 54 | Low |

The correction is intentionally narrow. It does not penalize a computer for
age, processor name, operating system, screen refresh rate, or core count.
Only measured workload behavior changes the result.

## Calibration check against known runs

Reprocessing the four most recent cross-device v6.2 logs produces:

| Device profile | v6.2 | v6.3 | v6.3 reserve |
|---|---:|---:|---:|
| Dell workstation, 12 logical processors | A+ 98 | A+ 98 | Very high, 92 |
| AMD laptop, 8 logical processors | A+ 96 | A+ 96 | High, 88 |
| HP Chromebook 13 G1, 4 logical processors | A+ 94 | A 92 | High, 85 |
| Lenovo ARM Chromebook, hitchy run | B 75 | B 75 | Moderate, 69 |

These are recalculations of captured runs, not hardware-model overrides. A new
run may differ with power state, browser configuration, temperature, or
background activity.

## Authenticated automatic run history

The internal deployment already requires platform authentication. Version 6.3
uses that authenticated identity to save each completed result automatically.

- The server reads the platform-provided authenticated email header.
- Runs are private to that email address.
- The complete result envelope is stored in the site's D1 database.
- The same completed run is deduplicated by user, start time, and profile.
- The site shows up to the latest 100 runs under **Saved runs**.
- Any saved run can be downloaded as JSON from any authenticated computer.
- Manual JSON export remains available as a fallback.
- A failed save never invalidates or blocks a benchmark result.

The browser never supplies or chooses the account identifier. Missing
authenticated identity causes the API to reject reads and writes.

## Stored fields

The run index stores the grade, score, confidence, browser, platform, logical
processor count, elapsed time, responsiveness summary, and headroom summary.
The complete v6.3 result envelope is also retained so future calibration work
can reprocess the underlying tier samples and integrity data.

## Validation requirements

Before deployment:

- all scoring and fixture tests must pass;
- the server-render smoke test must run with a test-only Cloudflare binding
  stub;
- the production bundle must include the results API;
- the D1 migration must create ownership and chronological indexes;
- the known-device logs above must retain their expected ordering.

