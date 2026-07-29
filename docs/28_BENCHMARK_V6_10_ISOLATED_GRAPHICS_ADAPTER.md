# Benchmark v6.10 — Isolated browser-graphics adapter

**Profile identifier:** `6.10.0-isolated-browser-graphics-adapter`  
**Result schema:** `stillgood-result.v6.10`

## Decision

StillGood measures a computer through a browser, but its main grade answers what
the computer remains useful for. A severely limited browser graphics path must
remain visible without automatically redefining otherwise consistent evidence
from browsing, email, documents, spreadsheets, multitasking, video, memory, and
storage.

Version 6.10 adds a narrowly gated compatibility adapter. It applies only when
all of the following are true:

- the browser does not expose either Long Tasks or Long Animation Frames
  performance entries;
- the median everyday core-work score is at least 80;
- the everyday graphics score is below 58;
- graphics trails the core-work median by at least 30 points;
- verified video playback scores at least 90.

When all gates pass, graphics remains measured, displayed, exported, and used
to produce a prominent browser-specific caution. It is excluded only from the
computer grade and performance-reserve calculation.

## What the adapter does not do

- It does not inspect the browser name or user agent.
- It does not add points or multiply a result.
- It does not alter a Chrome/Chromium execution path, threshold, or score.
- It does not hide the graphics score.
- It does not excuse broadly weak performance.
- It does not activate when graphics and ordinary work are both slow.

This is separate reporting, not score normalization. A user still learns that
animation-heavy pages may stutter in the tested browser.

## Reference replay

The four v6.9 physical exports used to introduce this rule replay as follows:

| Run | v6.9 | v6.10 replay | Adapter |
|---|---:|---:|---|
| HP Chromium | B+ 87 | B+ 87 | No |
| HP Firefox | B 85 | B 85 | No |
| Lenovo Chromium | C 71 | C 71 | No |
| Lenovo Firefox | C− 63 | C 73 | Yes |

The Lenovo Firefox run retained its visual score of 28. Its revised computer
grade is close to the Lenovo Chromium result because the remaining evidence
described a similar light-use device. Both Chromium reference scores are
unchanged.

## Relationship to established benchmarks

Speedometer corrects harness and workload differences so browsers perform the
same work, but does not award browser-specific score bonuses. WebXPRT describes
its output as a device-and-browser result. MotionMark reports graphics
performance directly and documents browser-dependent frame scheduling.

StillGood retains those principles while making one product-specific
distinction: a browser-only visual outlier can be reported as a browser
limitation instead of being allowed to determine the general computer grade.

## References

- [Speedometer 3 methodology](https://browserbench.org/Speedometer3.1/about.html)
- [Speedometer 3.1 corrections](https://browserbench.org/announcements/speedometer3.1/)
- [WebXPRT FAQ](https://www.principledtechnologies.com/benchmarkxprt/webxprt/faq)
- [MotionMark methodology](https://browserbench.org/MotionMark/about.html)
- [W3C Long Tasks](https://www.w3.org/TR/longtasks-1/)
- [W3C Long Animation Frames](https://www.w3.org/TR/long-animation-frames/)
