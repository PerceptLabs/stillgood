# Benchmark v6.5 — Memory pressure and persistent storage

**Status:** Implemented experimental profile  
**Profile identifier:** `6.5.0-memory-and-persistent-storage`  
**Result schema:** `stillgood-result.v6.5`

## Decision

StillGood v6.5 adds two browser-observable checks that help distinguish a
responsive old computer from one that occasionally pauses while catching up:

1. foreground responsiveness while progressively larger memory working sets
   remain active in a dedicated worker; and
2. persistent browser storage using bulk IndexedDB data, individual
   strict-durability IndexedDB commits, and an Origin Private File System
   write/flush/reopen/read sequence when supported.

These checks supplement the existing browsing, email, document, spreadsheet,
graphics, video, and multitasking modules. They do not replace them.

## Memory-pressure method

The benchmark progressively retains 64, 128, 256, and, where appropriate,
384 or 512 MB in a dedicated worker. Each allocated page is touched so the
test does not merely reserve untouched virtual address space. The worker scans
the active blocks and receives an 8 MB copied buffer while the foreground
records timer delay.

The result is based on:

- foreground 95th-percentile timer delay;
- the worst foreground delay; and
- the worker round-trip time for allocation, scanning, and an 8 MB structured
  clone.

The test stops increasing pressure when delay becomes severe. It releases all
retained blocks at the end or when the benchmark is cancelled.

This module deliberately reports **responsiveness under memory pressure**, not
RAM capacity, RAM bandwidth, swap use, or system-wide memory consumption.
`navigator.deviceMemory`, where exposed, is used only as a coarse safety limit
for the maximum test tier; the API intentionally provides an approximate,
privacy-reduced value.

## Persistent-storage method

The storage module uses three complementary browser operations:

### Bulk browser data

IndexedDB stores and reopens 1, 8, and 32 MB datasets. This preserves the
earlier StillGood browser-storage check and represents offline application
data.

### Small durable saves

The benchmark performs 8, 24, and 64 separate IndexedDB transactions with
`durability: "strict"` when supported. It measures median, 95th-percentile,
and worst commit delay, then reads the records back and verifies their sizes.
Separate commits expose stalls that a single large asynchronous transaction
can hide.

The option is a durability request to the browser. It is not a guarantee that
every browser, operating system, and storage device implements persistence in
the same way.

### Persistent local file

In a dedicated worker, the benchmark creates a temporary Origin Private File
System file, writes 4, 16, and 48 MB, calls `flush()`, closes it, reopens it,
performs seeded 4 KB reads, verifies the file size, and deletes it. A fixed
temporary filename allows a later run to clean up after an interrupted run.

The reported submetrics are:

- sequential write rate as a browser-observed diagnostic;
- explicit flush delay;
- reopen delay; and
- average seeded small-read latency.

The user-facing result remains **Persistent saves**. StillGood must not label
this as SSD/eMMC throughput because the browser, filesystem, cache, operating
system, and physical storage all contribute.

## Scoring and guardrails

Memory contributes 6% and persistent storage contributes 4% when available.
Unavailable optional modules are omitted and their weight is redistributed.
Both also contribute to the performance-reserve calculation, which prevents
fast easy tiers from implying modern-computer headroom.

- Memory below 68 caps the result at B; below 48 caps it at C+.
- Persistent storage below 58 caps the result at B; below 38 caps it at C+.
- A B+ requires a performance-reserve score of at least 88.
- A+ ceiling detection requires scores of at least 90 in the new modules when
  they are available.

The thresholds are experimental and must be calibrated against repeated runs
on SSD, SATA, and eMMC devices with human observations of save-dialogue, tab
close, and application-resume pauses.

## Graceful degradation

If memory pressure cannot run, StillGood records that limitation without
inventing a score. If OPFS sync access is unavailable, IndexedDB remains the
storage evidence and the report notes that persistent-file flush timing was
not measured. Temporary data is removed after the run.

## Research basis

- [W3C File System Standard — synchronous access handles](https://fs.spec.whatwg.org/#api-filesystemsyncaccesshandle)
- [MDN — FileSystemSyncAccessHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle)
- [MDN — IDBTransaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability)
- [MDN — Navigator.deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)
- [web.dev — storage for the web](https://web.dev/articles/storage-for-the-web)

