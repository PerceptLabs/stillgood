# Technical Architecture

## 1. Architecture decision

Build the MVP as a **static, local-first progressive web app** using **Vanilla TypeScript, semantic HTML, and CSS**, bundled with Vite or an equivalently lightweight tool.

Do not use React, Next.js, or a server-rendered application framework for the MVP. The benchmark should not spend a meaningful portion of an old computer’s capacity running its own UI framework.

## 2. High-level system

```text
Browser
├─ App shell and router
├─ Benchmark controller
│  ├─ Capability detection
│  ├─ Module lifecycle
│  ├─ Integrity monitor
│  ├─ Metric collectors
│  ├─ Scoring engine
│  └─ Recommendation engine
├─ Test modules
│  ├─ Everyday response
│  ├─ Documents
│  ├─ Multitasking
│  ├─ Smoothness
│  ├─ Video
│  └─ Browser storage
├─ Workers
│  ├─ text-index.worker.ts
│  ├─ data-transform.worker.ts
│  └─ image-transform.worker.ts
├─ Local persistence
│  ├─ IndexedDB results
│  └─ session checkpoint
└─ Service worker
   ├─ app-shell cache
   └─ versioned benchmark assets
```

No backend is required for MVP.

## 3. Technology choices

### Required

- TypeScript with strict mode
- Vite
- Native ES modules
- Custom lightweight component functions or Web Components
- CSS custom properties
- IndexedDB through a small internal wrapper
- Service worker written in project code
- Vitest for unit tests
- Playwright for end-to-end tests
- ESLint and Prettier or equivalent

### Avoid in MVP

- large UI frameworks;
- charting libraries;
- animation libraries;
- runtime schema libraries unless bundle impact is justified;
- analytics SDKs;
- third-party scripts on benchmark routes;
- WASM merely to inflate benchmark difficulty.

Use SVG and semantic HTML for result charts.

## 4. Core types

```ts
export type BenchmarkGrade = "A" | "B" | "C" | "D" | "E";
export type Confidence = "high" | "medium" | "low" | "invalid";

export interface BenchmarkContext {
  appVersion: string;
  profileVersion: string;
  fixtureVersion: string;
  startedAt: string;
  browserFamily?: string;
  browserVersion?: string;
  platformHint?: string;
  viewport: { width: number; height: number; dpr: number };
  powerState: "plugged" | "battery" | "unknown";
  runMode: "quick" | "full";
  setupMode: "normal" | "clean-comparison";
  capabilities: CapabilityMap;
}

export interface MetricSample {
  metricId: string;
  value: number;
  unit: "ms" | "ratio" | "fps" | "opsPerSecond" | "MiBPerSecond" | "count";
  source: "preferred-api" | "fallback" | "derived";
  valid: boolean;
  invalidReason?: string;
  timestamp: number;
  round: number;
}

export interface ModuleResult {
  moduleId: string;
  status: "complete" | "partial" | "failed" | "skipped";
  score?: number;
  samples: MetricSample[];
  integrityEvents: IntegrityEvent[];
  userPerception?: "comfortable" | "acceptable" | "frustrating" | "unable";
  startedAt: string;
  completedAt?: string;
}

export interface BenchmarkResult {
  id: string;
  context: BenchmarkContext;
  modules: ModuleResult[];
  categoryScores: Record<string, number | null>;
  overallScore: number | null;
  grade: BenchmarkGrade | null;
  confidence: Confidence;
  roles: string[];
  limitations: string[];
  recommendations: Recommendation[];
  rawProfileSnapshot: unknown;
}
```

## 5. Benchmark controller

The controller owns the state machine:

```text
idle
→ preparing-assets
→ preflight
→ warmup
→ module-ready
→ module-running
→ module-validating
→ module-complete
→ result-computing
→ complete
```

Side states:

- paused-interruption;
- canceled;
- partial;
- invalid;
- recoverable-error.

Only the controller can start pressure workers or commit scored samples.

## 6. Metric collectors

Create small collectors with a shared interface:

```ts
interface MetricCollector {
  id: string;
  supported(): boolean;
  start(context: CollectorContext): void | Promise<void>;
  stop(): MetricSample[] | Promise<MetricSample[]>;
  reset(): void;
}
```

Collectors:

- `EventTimingCollector`
- `InteractionFallbackCollector`
- `LongTaskCollector`
- `LongAnimationFrameCollector`
- `FrameCadenceCollector`
- `EventLoopLagCollector`
- `VideoQualityCollector`
- `NavigationTimingCollector`
- `IndexedDbTimingCollector`
- `IntegrityCollector`

Never put scoring logic inside collectors.

## 7. Interaction measurement

### Preferred path

Use `PerformanceObserver` for supported Event Timing entries. Correlate events to benchmark actions using action IDs and timestamps.

### Fallback path

- attach a capture-phase event listener;
- record `performance.now()`;
- execute action;
- resolve after two animation frames;
- record total presentation approximation;
- tag as fallback.

The fallback should not claim to be exact INP.

## 8. Frame measurement

1. Gather at least 120 low-load `requestAnimationFrame` samples.
2. Calculate median frame interval.
3. Remove obvious pause/outlier intervals from refresh-rate calibration.
4. During the module, compare each interval with the calibrated interval.
5. Record ratios rather than assuming 16.67 ms.
6. Detect hidden-tab pause through visibility events and invalidate the round.

## 9. Worker pressure design

Workers must receive a deterministic seed and work-unit count.

Example message:

```ts
interface WorkerRunRequest {
  runId: string;
  task: "text-index" | "data-transform" | "image-transform";
  seed: number;
  workUnits: number;
  deadlineMs: number;
}
```

Workers send periodic heartbeats and support cancellation.

The main thread maintains an emergency heartbeat. If heartbeat delay exceeds the configured threshold multiple times, cancel pressure and classify the module as early-stopped rather than freezing the page intentionally.

## 10. Scoring engine

Inputs:

- immutable profile configuration;
- normalized module metrics;
- module status;
- capability map;
- integrity events.

Outputs:

- metric scores;
- category scores;
- overall score;
- grade after gates;
- confidence;
- role badges;
- recommendation rule IDs.

Requirements:

- pure functions where possible;
- deterministic;
- exhaustive unit tests at thresholds;
- include profile snapshot in export;
- no hidden server-side adjustments.

## 11. Configuration

Load `benchmark-profile.v1.json` as a versioned static asset. Validate manually with a small internal validator.

Configuration includes:

- module weights;
- metric weights;
- normalization points;
- grade bands;
- gate rules;
- role requirements;
- confidence limits;
- safety timeouts;
- minimum sample counts.

Do not allow remote runtime changes to the active profile without a new version.

## 12. Persistence

### IndexedDB stores

- `results`
- `moduleCheckpoints`
- `assetMetadata`
- `userPreferences`

### Session recovery

Before each module:

- save current run ID and expected module;
- mark module `running`;
- on successful completion, mark complete;
- on startup, detect an unfinished module and explain that the previous run was interrupted.

Do not silently convert an interruption into a zero.

## 13. PWA and caching

Cache strategy:

- app shell: cache-first with version invalidation;
- benchmark fixtures: cache-first, immutable content hash;
- methodology pages: stale-while-revalidate;
- no third-party benchmark assets;
- verify required assets before a timed module.

The app should display:

> Test files ready. Network speed will not be included.

## 14. Export format

JSON export must contain:

- schema version;
- context;
- capability map;
- raw valid and invalid samples;
- module results;
- score calculations;
- profile snapshot;
- user perception answers;
- manual checklist, if completed.

Do not export stable browser identifiers or local history IDs that could be used for tracking across sites.

## 15. Optional anonymous aggregation — future

Not part of MVP. If added:

- explicit opt-in after results;
- separate consent for raw metrics and free-text notes;
- no IP retention beyond standard security logging;
- coarse device information only;
- public deletion and retention policy;
- server accepts only known benchmark versions;
- abuse and bot filtering without invasive fingerprinting.

## 16. Performance budget

### App shell

- JavaScript compressed: target ≤150 KB
- CSS compressed: target ≤35 KB
- HTML compressed: target ≤20 KB
- no benchmark media preloaded on landing

### Runtime

- no idle animation on benchmark routes;
- no polling faster than needed outside measured modules;
- result page charts rendered once;
- use content visibility and incremental rendering for long fixtures;
- do not use virtualized lists in ways that make the test meaningless unless the fixture specifies them.

## 17. Browser support

### Tier 1

- current Chromium-based browsers;
- current Firefox.

### Tier 2

- current Safari with fallbacks and lower confidence where required APIs are unavailable.

### Unsupported

Browsers without ES module, IndexedDB, Worker, or high-resolution timing support receive an explanation and may use a manual-only checklist.

## 18. Deployment

MVP can deploy to:

- GitHub Pages;
- Cloudflare Pages;
- Netlify;
- any static HTTPS host.

Use immutable hashed assets and a clear version in the footer and result export.
