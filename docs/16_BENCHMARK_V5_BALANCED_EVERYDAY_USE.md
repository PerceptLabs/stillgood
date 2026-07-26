# StillGood v5: Balanced Everyday-Use Benchmark

## Why v5 exists

The v4 benchmark greatly improved email, writing, and spreadsheet coverage, but
it accidentally allowed office workloads to define most of the overall result.
Office work was 52% of the weighted score, or 70% when multitasking was included.
That was too narrow for a general second-life computer check.

Version 5 restores the product's original purpose: a quick but broad check of
the things people commonly do with an older computer.

## Research basis

- Speedometer 3.1 combines varied scripted application journeys rather than
  treating a single application pattern as representative. Its workloads
  include rich-text editing, charts, dashboards, and news-site navigation:
  https://browserbench.org/Speedometer3.1/about.html
- UL Procyon treats office productivity as one important workload family within
  a wider benchmark suite. Its Office test uses realistic Word, Excel,
  PowerPoint, and Outlook actions, including moving between applications:
  https://benchmarks.ul.com/procyon/office-productivity-benchmark
- WebXPRT uses several distinct browser-based scenarios rather than one
  synthetic loop. Its published workload set includes image work, charts,
  encryption, OCR, and educational work:
  https://www.principledtechnologies.com/benchmarkxprt/webxprt/2021/index.php

StillGood adapts these principles, not their code.

## Eight short modules

1. Web browsing: articles, search results, shopping grids, busy home pages,
   filters, and pagination.
2. Email and webmail: search, conversations, sorting, newsletters, and replies.
3. Writing and documents: editing, formatting, tables, saving, and text reflow.
4. Spreadsheets: formulas, sorting, filtering, pasting, search, and scrolling.
5. Visual smoothness: increasing page-motion and canvas complexity.
6. Video playback: local 480p, 720p, and 1080p H.264 playback.
7. Multitasking: foreground interaction while controlled worker activity runs.
8. Browser storage and recovery: temporary local data followed by responsiveness
   recovery.

The new browsing module adds five deterministic local user journeys. It does not
depend on network speed, live websites, advertisements, or remote servers.

## Score balance

| Area | Weight |
|---|---:|
| Web browsing | 22% |
| Email and webmail | 9% |
| Writing and documents | 9% |
| Spreadsheets | 10% |
| Multitasking | 17% |
| Visual smoothness | 13% |
| Video playback | 12% |
| Browser storage | 3% |
| Recovery | 5% |

Office work now contributes 28%, enough to matter without replacing general
computer usability.

## Guardrails

- Browsing is a core category and can limit the final grade.
- A visual-smoothness or video result below the everyday-use boundary prevents
  an A grade even when office scores are excellent.
- A clearly weak visual or video result caps the score at B+ or lower.
- Invalid measurements lower confidence and cannot earn positive capability
  claims.
- Internal workload sizes remain in the exported diagnostic JSON. The normal
  user interface reports practical outcomes rather than dataset counts.

## Runtime target

The added browsing section is intentionally short. A capable system should
usually finish the complete benchmark in roughly one to two minutes. Older
systems may take longer because the workload ladder stops only after it locates
the device's practical limit.

## Future optional modules

Photo editing remains a candidate for an optional Creative check. It should not
be silently folded into the general score because it is less universal than
browsing, documents, video, and email, and it would materially extend runtime.
