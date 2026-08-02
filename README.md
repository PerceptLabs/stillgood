# StillGood

StillGood is a browser-based second-life computer benchmark. It runs
deterministic local workloads and explains what the tested computer-and-browser
combination can still do comfortably.

The v6.17.1 benchmark measures:

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

A clean preliminary score of 94 or above must also pass an upper-reserve stage.
That stage uses substantially larger inbox, document, and spreadsheet fixtures,
sustained multitasking and graphics pressure, touched memory sets up to 2 GB,
and a verified 256 MB browser save. It separates top-end sustained capacity
without changing the ordinary scoring path for older and midrange devices.

Version 6.17.1 keeps that reserve evidence separate from ordinary categories
and replaces the former shared 87-point headroom ceiling with a continuous
limit. Workload preparation is recorded separately from repeated interaction
timings so unlike operations cannot create false run-to-run variation.

Visual smoothness is evaluated against a fixed 60 fps usability target so a
high-refresh display does not receive a harder workload merely for refreshing
more often.

Results include an A–E rating, balanced category evidence, practical role
guidance, JSON export, and a printable detailed report. Completed results are
saved locally in the browser. No account is required, and optional anonymous
calibration sharing is off by default.

## Development

```bash
npm install
npm run dev
npm test
```

## Cloudflare deployment

The public target is `stillgood.fyi` on Cloudflare Workers. The Worker serves
the application and static benchmark assets; a free D1 database accepts only
explicitly opted-in, allowlisted anonymous measurements.

See `docs/32_PUBLIC_CLOUDFLARE_DEPLOYMENT.md` for the one-time account and domain
setup. Once the D1 UUID is configured:

```bash
npm run cloudflare:migrate
npm run deploy:cloudflare
```

The benchmark methodology and research decisions are documented under
`docs/`, with `docs/31_BENCHMARK_V6_13_BROWSER_EVIDENCE_BOUNDARY.md` describing
the browser-evidence policy, `docs/33_BENCHMARK_V6_17_UPPER_RESERVE.md` the
top-end scoring extension, `docs/34_BENCHMARK_V6_17_1_HEADROOM_CONTINUITY.md`
the current aggregation correction, and `docs/32_PUBLIC_CLOUDFLARE_DEPLOYMENT.md`
describing public operation.
