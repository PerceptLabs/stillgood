# Benchmark v6: adaptive headroom

## Decision

StillGood keeps its eight practical categories and adds an adaptive extension to
web browsing, email, documents, and spreadsheets. The extension exists to find
useful limits on systems that complete the ordinary workload too easily without
making the normal run needlessly punishing on older hardware.

This document supersedes v5 only for workload progression, latency-category
weighting, and limit reporting.

## Progression

Every system runs the same five ordinary tiers with five measured repetitions
per tier. An additional tier is eligible only when the preceding tier has:

- at least three valid observations;
- median journey time no greater than 450 ms;
- worst journey time no greater than 1,000 ms;
- coefficient of variation no greater than 0.35.

A second extension is eligible only when the first extension has:

- at least three valid observations;
- median journey time no greater than 850 ms;
- worst journey time no greater than 2,000 ms;
- coefficient of variation no greater than 0.45.

Extended tiers use three measured repetitions. A single journey longer than
five seconds ends repetitions for that tier. The section ends when the measured
median exceeds 2.5 seconds or its worst observation exceeds five seconds.

Unattempted extensions are omitted rather than recorded as failures. They are
diagnostic headroom, not requirements for an older computer to be useful.

## Added coverage

- Browsing increases the amount of local article, product, search, and filter
  data and renders denser result views.
- Email increases searchable and sortable local mail data and rendered message
  density.
- Documents increase text volume and rendered paragraphs so edits, formatting,
  tables, and reflow have more work to update.
- Spreadsheets extend formula, sort, filter, search, paste, and viewport work to
  larger local sheets.

Dataset sizes remain in the downloaded evidence file. They are intentionally
not shown in the everyday result because they are implementation details rather
than promises about a particular real application.

## Scoring and reporting

Measured latency tiers use dynamically normalized increasing weights. Later
tiers carry more influence, but a tier that was not eligible and not attempted
does not lower the score.

Each latency category can now report one of three headroom findings:

- **Limit found:** an extended tier reached limited, failed, or stopped status.
- **Extended range passed:** at least one extended tier passed, but the maximum
  extension was not reached comfortably.
- **Limit not reached:** both extensions remained comfortable or usable.

The ordinary capability guide still uses plain-language descriptions such as
"heavy webmail" and "complex long documents." Internal dataset counts and tier
names do not replace those recommendations.

## Reproducibility

The exported v6 result includes the exact headroom gate thresholds and
repetition counts. The fixed local data generators, deterministic seeds,
measured repetitions, and median-based decisions remain part of the
experimental record.

## Profile identifiers

- Benchmark profile: `6.0.0-adaptive-headroom`
- Export schema: `stillgood-result.v6`
