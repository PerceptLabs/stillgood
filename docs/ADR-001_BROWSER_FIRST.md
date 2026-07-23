# ADR-001: Browser-First Delivery

**Status:** Accepted for MVP  
**Date:** 2026-07-19

## Context

A native application could inspect more of the operating system and hardware. It could potentially measure boot integration, system memory pressure, temperatures, battery capacity, storage health, and application launch behavior.

However, the product’s intended users are evaluating old and varied devices. Requiring installation, administrator access, platform-specific packages, or trust in an unsigned utility would sharply reduce reach. The product must be available where users already are: in the browser.

## Decision

Build the first release as a browser-based progressive web app.

The app will measure browser-observable experience and disclose its limits. It will not infer missing system data.

## Consequences

### Positive

- one URL works across operating systems;
- no installation barrier;
- simple sharing among refurbishers and buyers;
- static hosting is inexpensive;
- deterministic assets can work offline after first load;
- the tested browser is itself a major part of everyday computer use;
- open methodology is easy to inspect.

### Negative

- cannot reliably inspect total RAM, swap, thermals, SMART, or battery health;
- results are browser-specific;
- browser throttling requires strict foreground integrity checks;
- some useful APIs vary by engine;
- cannot directly test native application launch or system suspend.

## Mitigations

- report observed symptoms rather than diagnoses;
- attach browser and benchmark versions to every result;
- use capability detection and confidence levels;
- keep manual hardware checks separate;
- consider an optional open-source native helper in a later phase;
- preserve the browser-only grade as the common baseline even if a helper exists.

## Rejected alternatives

### Native-only application

Rejected for the MVP because distribution and trust barriers conflict with broad second-life-device access.

### Electron application

Rejected because its runtime overhead would distort the very low-end devices being evaluated.

### Browser extension

Rejected because installation friction remains high and extension permissions create trust concerns.

### Live third-party website workflow

Rejected because changing sites, ads, network conditions, and cross-origin restrictions would undermine repeatability.
