# v6.8 paired-browser reference replay

## Purpose

Verify that the browser-neutral v6.8 corrections do not change the established
Chromium reference scores while correcting Firefox media-event interpretation
and adaptive email gating.

## Procedure

Five exported v6.6/v6.7 reports were passed back through the v6.8 scorer.
Because the earlier Firefox schema did not record waiting-event duration, the
conservative difference between the 4,500 ms observation window and measured
media advancement was supplied as both cumulative and longest waiting time.
Each observed difference was below the new 100 ms comfortable threshold.
Chromium reports already contained zero waiting events.

## Results

| Reference | Browser | Before | v6.8 replay | Change |
|---|---|---:|---:|---:|
| Dell workstation | Chromium | A+ 98 | A+ 98 | 0 |
| HP Chromebook | Chromium | B+ 87 | B+ 87 | 0 |
| Lenovo Chromebook | Chromium | C 70 under current grade ladder | C 70 | 0 |
| HP Chromebook | Firefox | B 83 | B 84 | +1 |
| Dell workstation | Firefox | B 83 | B+ 87 | +4 |

All replayed video tiers scored 100 where frame loss was zero and the
conservative waiting estimate remained below 100 ms.

The paired Firefox results regain separation because their ordinary email
scores were 96 and 98 respectively, while their complete adaptive-reserve email
scores remain 78 and 82. Extended reserve evidence is therefore preserved
without redefining ordinary capability.

## Conclusion

The v6.8 changes are selective by evidence, not by browser identity. The three
Chromium reference indices and grades remain unchanged. Firefox changes only
where prior interpretation conflated a brief event with a visible stall or
allowed adaptive reserve to trigger an everyday hard cap.
