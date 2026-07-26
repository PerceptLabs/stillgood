# StillGood

StillGood is a browser-based second-life computer benchmark. It runs
deterministic local workloads and explains what the tested computer-and-browser
combination can still do comfortably.

The v5 benchmark measures:

- articles, search results, shopping pages, navigation, and filters;
- large email websites and HTML message threads;
- long-document editing, formatting, word wrapping, and reopening;
- spreadsheet formulas, sorting, filtering, pasting, search, and scrolling;
- visual smoothness;
- local H.264 video playback;
- foreground responsiveness under background worker pressure;
- browser storage and recovery.

Results include an A–E rating, balanced category evidence, practical role
guidance, JSON export, and a printable detailed report.

## Development

```bash
npm install
npm run dev
npm test
```

The benchmark methodology and research decisions are documented under
`docs/`, with `docs/16_BENCHMARK_V5_BALANCED_EVERYDAY_USE.md` describing the
current balanced general-use revision.
