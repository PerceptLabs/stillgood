# StillGood

StillGood is a browser-based second-life computer benchmark. It runs
deterministic local workloads and explains what the tested computer-and-browser
combination can still do comfortably.

The v6.18 benchmark measures:

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

A broadly strong preliminary result must also pass a distinct mixed-workload
reserve stage before it can claim an A-range result. The stage overlaps
browsing, inbox, document, spreadsheet, video, Canvas photo editing, worker,
memory, and persistent-save work for about 12 seconds. It measures loaded
response, slowdown, tail delay, and frame delivery instead of replaying each
large module in isolation.

Version 6.18 makes ordinary responsiveness 78% of each core application score
and adaptive capacity 22%. Sub-100 ms differences remain measurable, headroom
uses a smooth one-point-per-point ceiling, and a completed run without the
mixed reserve evidence remains eligible for a strong B+ second-life result.

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
the browser-evidence policy, `docs/35_BENCHMARK_V6_18_ADAPTIVE_MIXED_RESERVE.md`
the current aggregation and sustained-reserve method, and `docs/32_PUBLIC_CLOUDFLARE_DEPLOYMENT.md`
describing public operation.
