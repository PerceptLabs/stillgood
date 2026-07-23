# Benchmark Methodology

## 1. Measurement philosophy

StillGood is a **usability benchmark**, not a peak-performance benchmark. The primary unit of concern is delay that a person can see or feel.

The benchmark therefore prioritizes:

- interaction latency distributions;
- frame pacing and dropped frames;
- responsiveness while background work is active;
- recovery after pressure;
- successful completion without freezes or reloads;
- repeatability and run confidence.

Raw throughput is supporting evidence, not the headline result.

## 2. What a browser can and cannot measure

### Browser-observable

- custom task durations through high-resolution timing;
- page navigation and resource timings;
- click/keyboard interaction timing where Event Timing is supported;
- main-thread tasks of 50 ms or longer where Long Tasks is supported;
- animation frame cadence using `requestAnimationFrame`;
- long animation frames where supported;
- video dropped-frame counts and frame callbacks;
- Web Worker throughput;
- IndexedDB transaction timing;
- visibility, focus, viewport, and interruption events;
- coarse logical processor availability;
- coarse device-memory hints in some browsers.

### Not reliably browser-observable

- total physical RAM and current system-wide memory pressure;
- swap usage;
- CPU model, clocks, temperature, throttling, or package power;
- disk model, SMART health, and true raw storage throughput;
- battery health and capacity across browsers;
- operating-system boot time;
- suspend/resume reliability outside the page;
- performance of arbitrary third-party applications.

The report must use phrases such as **“observed high interaction delay under pressure”**, not **“your CPU is too slow.”**

## 3. Test conditions

The app should ask the user to:

1. finish operating-system and browser updates;
2. close unrelated heavy applications when seeking a clean comparison;
3. use the computer in its normal power mode;
4. plug in the device for repeatable comparisons, or clearly mark battery mode;
5. keep the benchmark tab visible;
6. avoid resizing the window during a module;
7. allow the device to cool before repeating a failed or unusually poor run.

These are recommendations, not hard requirements. The recorded conditions appear in the result.

## 4. Run structure

### Step A: Asset preparation

- Download all timed assets.
- Verify content hashes.
- Cache assets through the service worker.
- Confirm video codec support.
- Decode a small warm-up image and parse a small warm-up data fixture.

No network transfer is included in module scoring.

### Step B: Capability map

Create a capability record using feature detection, not user-agent assumptions.

Example capabilities:

```json
{
  "performanceObserver": true,
  "eventTiming": true,
  "longTasks": true,
  "longAnimationFrames": false,
  "videoPlaybackQuality": true,
  "requestVideoFrameCallback": true,
  "offscreenCanvas": true,
  "webWorkers": true,
  "indexedDB": true,
  "battery": false
}
```

### Step C: Warm-up

Run one short, unscored pass for:

- common rendering path;
- worker startup;
- fixture parsing;
- IndexedDB open;
- video decoder initialization.

### Step D: Scored modules

Each scored module contains:

- a clear instruction;
- a countdown or readiness cue;
- two or three measured rounds;
- automatic integrity checks;
- a brief optional “How did that feel?” question that is stored separately from the score.

### Step E: Stability analysis

For repeated metrics, compute:

- median;
- 75th percentile;
- 95th percentile;
- worst valid sample;
- coefficient of variation or robust equivalent;
- count and duration of interruptions.

### Step F: Result synthesis

Compute category scores, overall grade, role badges, confidence, and recommendation text from versioned rules.

## 5. Module specifications

## 5.1 Everyday responsiveness

### Scene

A local single-page “work desk” contains:

- inbox list with 200 deterministic messages;
- search box;
- sort control;
- message preview panel;
- compose box;
- small attachment-style image thumbnails;
- task checklist.

### User actions

- click three specified messages;
- filter the inbox using a prompted term;
- sort by sender;
- type a supplied 40–60 character sentence;
- toggle three checklist items.

### Automated actions

- update the DOM after each interaction;
- perform bounded list filtering and layout work;
- introduce one realistic medium-complexity component update, not an artificial busy loop.

### Metrics

- interaction-to-next-paint or best available fallback;
- input delay;
- processing duration;
- presentation delay;
- p75 and p95 interaction latency;
- long-task count and total blocking duration;
- late-frame ratio;
- errors and missed input.

### Integrity rules

- invalidate interaction samples when the page is hidden;
- exclude the first interaction after a long idle interval from the main percentile but retain it diagnostically;
- require at least 10 valid discrete interactions.

## 5.2 Documents and search

### Fixture

A versioned local “community handbook” document:

- approximately 40 pages of equivalent content;
- 35,000–50,000 words;
- 12 tables;
- 20 compressed images;
- headings, footnotes, and callout boxes;
- deterministic search terms with known counts.

### Actions

- open the document view;
- jump to a heading;
- search for a term;
- sort a 500-row table;
- edit a paragraph in a lightweight editor;
- save a local draft;
- reopen the saved draft.

### Metrics

- first meaningful render after opening the module;
- search completion latency;
- table sort and repaint latency;
- editing interaction p95;
- local save transaction latency;
- long-task ratio;
- memory-related symptoms observable inside the app, such as dropped component state or reload.

## 5.3 Multitasking and recovery

### Calibration

Run a 500–800 ms worker calibration task. Estimate work units required for a target pressure window of approximately 8 seconds.

### Pressure workload

Use deterministic, bounded operations with no network:

- text tokenization and inverted-index creation;
- JSON parse/transform/stringify;
- image pixel transformation in `OffscreenCanvas` when supported;
- typed-array sorting and checksum work.

Avoid pure empty loops. Work should resemble browser application computation.

### Worker count

Use:

```text
workerCount = clamp(1, min(4, hardwareConcurrency - 1), availableWorkerLimit)
```

If `hardwareConcurrency` is unavailable, use 1 worker. Never spawn an unbounded number of workers.

### Foreground task

While workers run, the user:

- types a short sentence;
- switches among three internal app panels;
- searches a list;
- presses a response button when it changes state.

### Metrics

- p95 interaction latency under pressure;
- change from baseline latency;
- late-frame ratio;
- audio interruption flag if a simple tone loop is included and permitted;
- worker throughput;
- time from pressure end until five consecutive event-loop probes remain below the recovery threshold;
- errors, page reload, or incomplete worker messages.

### Safety

- pressure window target: 8 seconds;
- hard stop: 15 seconds;
- cancel immediately if UI heartbeat exceeds the emergency threshold for multiple probes;
- allow user cancellation at all times.

## 5.4 Visual smoothness

### Scene

A deterministic dashboard animation with:

- vertical list scroll;
- two transform-based cards;
- a small canvas graph;
- image thumbnails entering and leaving view;
- no flashing and no rapid contrast inversion.

### Measurement

- estimate display cadence during a low-load calibration period;
- use `requestAnimationFrame` timestamps;
- calculate expected frame interval from the median calibration interval;
- define a late frame relative to that interval rather than assuming 60 Hz;
- record p95 frame interval and late-frame percentage;
- use Long Animation Frames where available as diagnostic evidence.

### Accessibility

The module is optional for users who cannot comfortably view motion. Skipping it produces a partial result and does not imply poor device performance.

## 5.5 Video playback

### Assets

Provide short clips with identical visual content in at least:

- 1080p30 H.264/AAC MP4;
- 1080p30 VP9/Opus WebM;
- 720p30 fallback versions.

Select a supported codec, record the codec, and never compare different codecs without displaying the difference.

### Procedure

1. Confirm the asset is cached.
2. Play for at least 20 seconds.
3. Seek twice to deterministic timestamps.
4. Continue playback after each seek.
5. If 1080p is below the usable threshold, repeat at 720p.

### Metrics

- dropped frames / total frames;
- playback start latency after cached load;
- seek recovery time;
- callback lateness where supported;
- playback stalls;
- highest comfortable tier.

### Interpretation

Video results are highly sensitive to codec and hardware-decoding support. Report this explicitly.

## 5.6 Browser storage

### Procedure

- create a temporary IndexedDB database;
- write 16 MiB in 256 KiB records;
- commit in bounded batches;
- read a deterministic random sample;
- delete the database;
- verify cleanup.

Scale down to 8 MiB when storage quota is limited. Do not request persistent storage for the benchmark.

### Metrics

- database open latency;
- median and p95 batch-commit latency;
- aggregate write throughput;
- median random-read latency;
- cleanup success.

### Limitations

This test reflects browser storage, cache, and origin quota behavior. It must not be labeled as an SSD or eMMC benchmark.

## 6. Fallback measurement strategy

### Preferred interaction metric

Use Event Timing through `PerformanceObserver` when available.

### Fallback

For each controlled interaction:

1. record a high-resolution timestamp at event receipt;
2. perform the intended update;
3. schedule `requestAnimationFrame`;
4. schedule a second `requestAnimationFrame` to approximate presentation completion;
5. record elapsed time;
6. mark the metric as fallback-derived.

Fallback results lower confidence but remain useful.

### Long tasks unavailable

Use a recurring event-loop lag probe and frame intervals. Do not synthesize a “long task count” from unrelated metrics.

### Video quality unavailable

Use `requestVideoFrameCallback` if available. Otherwise mark dropped-frame precision unavailable and score using stalls, callback timing, and playback completion with lower confidence.

## 7. Interruption and invalidation rules

Pause or invalidate a module when:

- `document.visibilityState !== "visible"`;
- focus is lost for more than 1 second during an interactive round;
- viewport area changes by more than 15%;
- device orientation changes;
- benchmark asset hash fails;
- a required worker crashes;
- system clock changes do not matter because monotonic performance time is used;
- the user opens print or export during a run.

Offer a clean restart of only the affected module.

## 8. Repeatability

- Run two measured rounds in Quick Check and three in Full Test.
- Use deterministic fixtures and seeded random data.
- Discard warm-up samples.
- Prefer medians for central tendency.
- Use p95 for noticeable worst-case latency.
- Flag high variability rather than averaging it away.
- Preserve raw metrics in exports.

## 9. Ethical load limits

StillGood must not:

- run sustained maximum load for minutes;
- hide resource use;
- continue pressure after the user cancels;
- attempt to infer identity from timing signatures;
- mine cryptocurrency;
- compare users on a public leaderboard by default.

The interface should state when a short pressure test begins and when it ends.
