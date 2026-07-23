# Research Basis and Standards Notes

## 1. Why this is not simply another Speedometer

Speedometer is designed to measure web-application responsiveness by timing simulated interactions across representative web workloads. That makes it an important reference, but StillGood has a different output goal: translate interaction behavior, motion, media, pressure, and recovery into role suitability for an individual device.

Reference:

- BrowserBench, **Speedometer 3 About**

## 2. Interaction thresholds

Interaction to Next Paint is a field responsiveness metric. Current web guidance uses:

- 200 ms or less as good;
- greater than 500 ms as poor.

StillGood uses these as anchors, while adding stricter excellent thresholds and slower severe thresholds for a device-level usability rubric.

References:

- web.dev, **Interaction to Next Paint (INP)**
- web.dev, **How the Core Web Vitals metrics thresholds were defined**

## 3. Long tasks

The Long Tasks API identifies tasks that monopolize the browser’s UI thread for 50 ms or more. Long tasks matter because they can delay input handling and visual updates.

References:

- W3C, **Long Tasks API**
- MDN, **PerformanceLongTaskTiming**

## 4. Custom task timing

The User Timing API provides high-resolution custom marks and measures for application-defined operations. StillGood uses the same principle for deterministic benchmark actions.

References:

- MDN, **User timing**
- W3C, **Performance Timeline**

## 5. Navigation and resources

Navigation Timing and Resource Timing expose detailed page and asset timing. StillGood uses them for preparation diagnostics, but excludes network transfer from the device score by caching assets before measured modules.

References:

- W3C, **Navigation Timing Level 2**
- W3C, **Resource Timing**

## 6. Animation and visibility

`requestAnimationFrame` generally follows display refresh cadence and is paused or throttled in hidden tabs. This is why the benchmark calibrates against observed cadence and invalidates backgrounded rounds.

Reference:

- MDN, **Window: requestAnimationFrame()**

Long Animation Frames can provide additional diagnostic information about frames that block rendering and interaction, but support must be feature-detected.

Reference:

- MDN, **Long animation frame timing**

## 7. Background pressure

Web Workers run work away from the main browser execution thread and make it possible to apply bounded background pressure while measuring foreground responsiveness.

Reference:

- MDN, **Web Workers API**

OffscreenCanvas can move some canvas work into workers, but support varies by feature and must not be required.

Reference:

- MDN, **OffscreenCanvas**

## 8. Video quality

`getVideoPlaybackQuality()` exposes total and dropped video-frame counts in supporting browsers. `requestVideoFrameCallback()` can provide per-video-frame callback timing.

References:

- MDN, **VideoPlaybackQuality: droppedVideoFrames**
- MDN, **HTMLVideoElement: requestVideoFrameCallback()**

## 9. Hardware hints are limited

`navigator.hardwareConcurrency` reports logical processors available to the browser, which may be less than the physical system total. `navigator.deviceMemory`, where available, is coarse and intentionally reduced for privacy.

References:

- MDN, **Navigator: hardwareConcurrency**
- MDN, **Navigator: deviceMemory**

These values must not be treated as exact inventory data or core scoring inputs.

## 10. Storage estimates are origin-scoped

`navigator.storage.estimate()` reports an estimate of usage and quota available to the origin. It is not a raw disk-capacity or free-space API. IndexedDB timing reflects the browser storage path and is therefore a low-weight category.

References:

- MDN, **StorageManager: estimate()**
- MDN, **Storage API**

## 11. Battery information is not portable

The Battery Status API has limited availability and requires a secure context in supporting browsers. It cannot be the basis of a cross-browser battery-health score.

Reference:

- MDN, **Battery Status API**

## 12. Research interpretation

The initial thresholds in this pack are a transparent starting hypothesis. Only the 200 ms and 500 ms interaction anchors and the 50 ms long-task definition have direct standards/guidance grounding. Role thresholds, grade weights, dropped-frame bands, and recovery bands must be validated on physical devices with human comfort ratings before the benchmark is presented as established rather than Experimental.
