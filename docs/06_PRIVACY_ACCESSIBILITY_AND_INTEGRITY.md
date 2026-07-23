# Privacy, Accessibility, and Benchmark Integrity

## 1. Privacy requirements

### Default behavior

- No account.
- No result upload.
- No advertising scripts.
- No cross-site trackers.
- No third-party fonts.
- No fingerprinting library.
- Results remain in local browser storage.

### Data minimization

Collect only what is required to interpret the run:

- browser family and broad version when available;
- broad platform hint;
- viewport and pixel ratio;
- supplied power condition;
- supported capability flags;
- benchmark metrics;
- benchmark version.

Do not collect:

- installed fonts;
- canvas fingerprint hashes;
- audio fingerprints;
- full plugin lists;
- serial numbers;
- local file paths;
- device names;
- precise location;
- persistent cross-site identifiers.

### Coarse hardware hints

`hardwareConcurrency` and `deviceMemory` may be recorded locally as coarse context if available. They must not influence the core grade in v1 and must not be uploaded without explicit consent.

### Analytics

For MVP, prefer no analytics. If basic operational analytics are later added:

- exclude benchmark routes from session replay;
- never capture typed benchmark text;
- do not send raw timing samples by default;
- publish the exact event list;
- provide a no-analytics build option.

## 2. Accessibility target

Target WCAG 2.2 AA for all ordinary interface screens.

### Required

- complete keyboard navigation;
- visible focus indicators;
- semantic landmarks and headings;
- form labels and error associations;
- no color-only meaning;
- sufficient contrast;
- zoom to 200% without loss of core functionality;
- understandable status announcements through an ARIA live region;
- no flashing content;
- large hit targets where practical;
- result charts accompanied by text values.

### Motion

- Respect `prefers-reduced-motion` everywhere except an explicitly chosen motion benchmark.
- Do not autoplay the smoothness module for reduced-motion users.
- Allow skipping the module.
- Never use rapid zoom, parallax, or flashing patterns.

### Cognitive load

- one instruction at a time;
- examples directly beside tasks;
- no countdown that disappears before the user is ready;
- progress by completed modules;
- plain-language labels before technical details.

### Input differences

The benchmark must support mouse, trackpad, touch, and keyboard. Do not score the user’s pointing accuracy or typing speed.

## 3. Benchmark integrity

### Foreground requirement

Browsers commonly throttle animation and work in background tabs. Monitor:

- `visibilitychange`;
- window focus/blur;
- large viewport changes;
- page lifecycle events.

Stop the active round when integrity is compromised.

### Asset integrity

- bundle all workloads;
- use content hashes;
- cache before timing;
- verify fixture version;
- do not time server response or CDN behavior as device performance.

### Extension and browser effects

Extensions, privacy tools, and browser configuration are part of the actual browsing environment. Do not attempt to evade or disable them.

Result text should say:

> This score reflects this browser and its current configuration.

For controlled comparisons, advise users to keep browser, profile, extensions, and power state consistent.

### Thermal and background variability

The browser cannot prove thermal throttling or operating-system background pressure. Detect high round-to-round variability and report it neutrally.

### Cheating and leaderboards

The MVP has no competitive leaderboard. This removes most incentive to manipulate results. Future comparisons must retain raw metrics and benchmark version.

## 4. Safety requirements

- Every pressure workload has a hard deadline.
- Every worker supports cancellation.
- UI heartbeat stops pressure early when responsiveness becomes severe.
- User can stop at any time.
- No module sustains maximum load for longer than 15 seconds.
- Storage writes are bounded and temporary.
- App does not request persistent storage for benchmark data.
- Warn users separately about swollen or damaged batteries in the manual checklist.

## 5. Manual hardware checklist separation

The optional manual checklist can produce the following statuses:

- Hardware basics passed
- Mobility limited
- Plug-in use recommended
- Repair recommended
- Battery safety warning

It does not alter the browser performance grade.

A battery-safety warning should state:

> Stop using or charging a swollen, leaking, unusually hot, or physically damaged battery and seek qualified service.

Do not ask users to puncture, compress, or remove a swollen battery unless they are qualified to do so.

## 6. Transparency requirements

Publish in-app:

- benchmark methodology;
- category weights;
- current thresholds;
- limitations;
- source code license;
- benchmark and fixture version;
- changelog describing scoring changes.

A score from a new profile version must not be presented as directly comparable to an old profile without a migration note.
