# StillGood

StillGood is a browser-based second-life computer benchmark. It runs
deterministic local workloads and explains what the tested computer-and-browser
combination can still do comfortably.

The v6.1 benchmark measures:

- articles, search results, shopping pages, navigation, and filters;
- large email websites and HTML message threads;
- long-document editing, formatting, word wrapping, and reopening;
- spreadsheet formulas, sorting, filtering, pasting, search, and scrolling;
- visual smoothness;
- local H.264 video playback;
- foreground responsiveness under background worker pressure;
- browser storage and recovery.

On systems that complete the ordinary browsing and office workloads quickly and
consistently, StillGood automatically adds controlled headroom tiers to locate
the practical limit. Slower systems stop on the normal path without being
penalized for extensions they did not attempt.

Visual smoothness is evaluated against a fixed 60 fps usability target so a
high-refresh display does not receive a harder workload merely for refreshing
more often.

Results include an A–E rating, balanced category evidence, practical role
guidance, JSON export, and a printable detailed report.

## Development

```bash
npm install
npm run dev
npm test
```

The benchmark methodology and research decisions are documented under
`docs/`, with `docs/17_BENCHMARK_V6_ADAPTIVE_HEADROOM.md` and
`docs/18_BENCHMARK_V6_1_REFRESH_NORMALIZATION.md` describing the current
adaptive general-use revision.
