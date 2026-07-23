# Scoring and Rubric Specification

## 1. Design goals

The score must be:

- understandable;
- stable enough for before-and-after comparison;
- sensitive to freezes and high-percentile delay;
- forgiving of weaknesses that do not affect a chosen role;
- transparent and versioned;
- honest about missing metrics.

## 2. Category weights

| Category | Weight |
|---|---:|
| Everyday responsiveness | 30% |
| Documents and search | 20% |
| Multitasking and recovery | 25% |
| Visual smoothness | 10% |
| Video playback | 10% |
| Browser storage | 5% |

The first three are **core categories**. Video, motion, and storage cannot by themselves condemn a machine that remains good for office or thin-client use.

## 3. Metric normalization

Each metric is converted to a 0–100 score using piecewise linear interpolation between points in `benchmark-profile.v1.json`.

Rules:

1. Lower-is-better metrics list descending quality points, such as latency.
2. Higher-is-better metrics list ascending quality points, such as successful throughput.
3. Values between points are linearly interpolated.
4. Values outside the table are clamped to 0 or 100.
5. Missing optional metrics are omitted and remaining metric weights are normalized within the category.
6. Missing required metrics mark the category incomplete.

## 4. Recommended metric thresholds

These values are initial research-grounded hypotheses and require calibration.

### 4.1 Interaction latency p95

| p95 latency | Score interpretation |
|---:|---|
| ≤100 ms | Excellent / immediate-feeling |
| 200 ms | Good |
| 350 ms | Noticeable but usable |
| 500 ms | Poor boundary |
| 1,000 ms | Frustrating |
| ≥2,000 ms | Severe |

### 4.2 Long-task blocked-time ratio

Blocked time is the sum of long-task duration beyond the first 50 ms, divided by measured module duration.

| Blocked-time ratio | Interpretation |
|---:|---|
| ≤1% | Excellent |
| 3% | Good |
| 8% | Noticeable |
| 15% | Poor |
| ≥35% | Severe |

### 4.3 Late animation frames

A late frame is defined relative to calibrated display cadence.

| Late frames | Interpretation |
|---:|---|
| ≤1% | Excellent |
| 3% | Good |
| 5% | Usable |
| 10% | Poor |
| ≥25% | Severe |

### 4.4 Video dropped frames

| Dropped frames | Interpretation |
|---:|---|
| ≤0.5% | Excellent |
| 1% | Good |
| 3% | Usable |
| 5% | Marginal |
| 10% | Poor |
| ≥25% | Severe |

### 4.5 Recovery time

Time after pressure ends until five consecutive responsiveness probes meet the recovery threshold.

| Recovery time | Interpretation |
|---:|---|
| ≤300 ms | Excellent |
| 1 second | Good |
| 3 seconds | Usable |
| 5 seconds | Poor |
| 10 seconds | Severe |
| ≥20 seconds | Failed recovery |

## 5. Category composition

### Everyday responsiveness

- 60% interaction p95
- 20% interaction p75
- 15% blocked-time ratio
- 5% task completion integrity

### Documents and search

- 30% document open/render
- 25% search latency
- 20% table operation and repaint
- 15% editing interaction p95
- 10% local save/reopen

### Multitasking and recovery

- 45% interaction p95 under pressure
- 20% latency degradation versus baseline
- 15% recovery time
- 10% late-frame ratio
- 10% workload completion integrity

### Visual smoothness

- 60% late-frame ratio
- 25% p95 frame interval relative to refresh cadence
- 15% long-animation-frame evidence or fallback event-loop lag

### Video playback

- 60% dropped-frame ratio
- 15% stalls
- 15% seek recovery
- 10% cached playback start

Apply a tier modifier:

- 1080p comfortable: ×1.00
- 1080p marginal but 720p comfortable: ×0.85
- 720p marginal: ×0.65
- below 720p: ×0.40

### Browser storage

- 50% p95 write-commit latency
- 20% sequential write throughput
- 20% random-read latency
- 10% cleanup/integrity

## 6. Overall score

```text
overall = sum(categoryScore × categoryWeight) / sum(completedCategoryWeights)
```

Round only for display. Preserve at least two decimal places internally.

## 7. Grade bands

| Score | Grade | Label | Meaning |
|---:|:---:|---|---|
| 85–100 | A | Comfortable | Normal basic-computer experience |
| 70–84 | B | Useful | Practical with minor limitations |
| 50–69 | C | Light-duty | Worthwhile with deliberate workload choices |
| 30–49 | D | Single-purpose | Best for one narrow role at a time |
| 0–29 | E | Struggling | General browser workload is not practical |

## 8. Gate rules

Arithmetic averages can hide a serious weakness. Apply these caps after computing the score.

1. Any failed core category caps the result at E.
2. Any core category below 25 caps the result at D.
3. Multitasking below 40 adds **One task at a time** and prevents the Multitasking Ready badge.
4. A skipped category prevents High confidence.
5. A browser crash or inferred interrupted run marks the run Invalid unless all affected modules are repeated.
6. Video or visual smoothness alone cannot cap Web/Email or Office role badges.
7. Storage alone cannot lower the letter grade by more than one band.

## 9. Role badges

### Web and Email Ready

Required:

- responsiveness ≥60;
- documents ≥45;
- multitasking ≥40;
- no core failure.

### Office Ready

Required:

- responsiveness ≥60;
- documents ≥60;
- multitasking ≥50;
- local save/reopen integrity pass.

### Media Ready

Required:

- video ≥60;
- visual smoothness ≥50;
- no playback stalls longer than 1 second after warm-up.

### Multitasking Ready

Required:

- responsiveness ≥65;
- documents ≥60;
- multitasking ≥65;
- recovery ≤3 seconds;
- no severe integrity events.

### Thin-Client Ready

Required:

- responsiveness ≥50;
- visual smoothness ≥40 or skipped;
- reliability/integrity pass;
- multitasking ≥35.

### Single-Purpose Candidate

Award when:

- overall grade is D or E;
- at least one role-relevant category is ≥55;
- no integrity failure prevents safe use.

Examples:

- media player;
- writing terminal;
- kiosk/signage;
- SSH/remote-desktop terminal;
- recipe or workshop station.

## 10. Confidence calculation

### High

- all modules completed;
- direct preferred APIs cover the majority of core metrics;
- no interruption;
- repeated-round variation ≤15%;
- assets verified and cached;
- result is not using a known compatibility exception.

### Medium

- one optional metric uses fallback;
- variation >15% and ≤30%;
- one non-core category skipped;
- minor focus interruption was repeated successfully.

### Low

- multiple fallback metrics;
- variation >30%;
- core category partial;
- unusual viewport or power condition;
- result based on a single valid round.

### Invalid

- hidden/backgrounded test was not repeated;
- required asset failure;
- page reload or worker failure during a core module;
- too few valid interactions;
- user canceled before enough data was collected.

## 11. Human perception check

After each module, optionally ask:

- Comfortable
- Acceptable
- Frustrating
- Could not complete

This answer does **not** alter the v1 objective score. It is shown beside the metric result and, with explicit consent, may be used to calibrate future benchmark profiles.

Reason: subjective comfort is the target outcome, but directly blending a self-rating into the score would reduce repeatability and create circular scoring.

## 12. Recommendation logic

Recommendations are rules based on patterns.

### High baseline latency

> Ordinary interactions were delayed even before pressure was added. A lighter browser profile, fewer extensions, or a lighter desktop environment may help. Compare again after a clean restart.

### Large pressure degradation, good baseline

> The machine feels fine for one task but slows sharply when work overlaps. Treat it as a one-main-task computer and close finished tabs or applications.

### Weak video, otherwise good

> Video playback is the main limitation. Codec support or hardware acceleration may be involved. Compare a current Chromium-based browser and Firefox using the same clip.

### High variability

> Results changed substantially between rounds. Background activity, thermal limits, updates, or power settings may be affecting consistency. Repeat under stable conditions.

### Slow browser storage only

> Local browser saves were slower than the other tasks. Keep free storage available and compare after checking the device’s storage health outside this web app.

Always use **may**, **could**, or **suggests** for causes the browser cannot prove.

## 13. Example result

```text
StillGood Rating: C — Light-duty (63/100)
Confidence: High

Best uses
✓ Web and Email Ready
✓ Office Ready
✓ Thin-Client Ready

Limits
• One main task at a time
• 720p video recommended

Category scores
Responsiveness       72
Documents            68
Multitasking         41
Visual smoothness    57
Video                52
Browser storage      61

Observed pattern
The computer responded well during ordinary work but slowed sharply when background tasks were added.
```
