# Benchmark v6.9 — Browser-neutral compatibility adapters

**Profile identifier:** `6.9.0-browser-neutral-compatibility-adapters`
**Result schema:** `stillgood-result.v6.9`

## Decision

StillGood may use a compatibility adapter when browser engines expose or invoke
equivalent Web Platform behavior differently enough to distort the intended
measurement.

An adapter must:

- provide the same workload data and user journey to every browser;
- preserve the same success conditions and score thresholds;
- use capability or standards behavior rather than the browser name;
- be outside the timed region when it represents reusable application setup;
- expose its strategy in the exported raw result;
- have deterministic and browser-identity regression tests.

An adapter must not:

- multiply or add points for a named browser;
- reduce a workload only for one engine;
- hide a genuine difference in completed work;
- substitute an easier API solely because an engine is slower;
- claim that browser-and-device results are hardware-only.

## Text-sorting adapter

The maximum email workload revealed that repeated
`String.prototype.localeCompare()` calls dominated one large sort in Firefox.
The same measured action spent approximately 569 ms in Firefox and 98 ms in
Chromium on the paired Dell run. Presentation time was similar; the difference
was inside fixture computation.

ECMA-402 defines `localeCompare()` in terms of an `Intl.Collator`, and MDN
recommends creating and reusing a collator when sorting large arrays. A real
application would normally reuse this setup instead of rebuilding collation
state for every comparison.

Version 6.9 therefore initializes one `Intl.Collator` using fixed `en-US`,
sorting usage, and base sensitivity. It derives stable numeric ranks for the
small fixed sets of sender and model labels when the workload module loads.
Timed email and document-table sorts compare those ranks, with a deterministic
record ID tie-breaker.

Every browser receives the same:

- locale and collation options;
- generated records;
- number of comparisons;
- rendered output;
- success assertions;
- latency thresholds and score rules.

There is no user-agent branch.

## Relationship to established benchmarks

Speedometer uses workload and harness corrections to ensure engines perform the
same work, including compatibility handling for event construction. Speedometer
3.1 corrected workloads that performed slightly different work across browsers
rather than applying score multipliers.

WebXPRT explicitly describes its output as a device-and-browser result. StillGood
retains that interpretation: adapters remove benchmark artifacts, not genuine
engine differences.

## Expected effect

The adapter is expected to reduce the pathological Firefox cost in the largest
locale-aware sorts. Chromium executes the corrected path too. Its final paired
Dell reference is already at the A+ ceiling, so its interpretation is expected
to remain stable even if raw sort timing shifts slightly.

Fresh paired runs are required to quantify v6.9 because older exports contain
the results of the previous sorting implementation.

## References

- [Speedometer 3.1 corrections](https://browserbench.org/announcements/speedometer3.1/)
- [Speedometer benchmark runner](https://github.com/WebKit/Speedometer/blob/main/resources/benchmark-runner.mjs)
- [MDN: String.prototype.localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)
- [ECMA-402 Collator objects](https://tc39.es/ecma402/2025/#collator-objects)
- [WebXPRT FAQ](https://www.principledtechnologies.com/benchmarkxprt/webxprt/faq)
