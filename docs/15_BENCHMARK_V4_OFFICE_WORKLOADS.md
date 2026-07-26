# StillGood Benchmark v4 — Office Workloads

## Decision

Version 4 makes email, writing, and spreadsheets separate first-class
categories. Together with multitasking, they are the core of the second-life
computer result. The benchmark no longer uses a generic document-and-table
fixture to justify broad office claims.

## Research basis

- Speedometer 3.1 demonstrates the value of scripted, deterministic user
  journeys, a warm-up phase, repeated measurements, and an action-to-render
  timing boundary. Its CodeMirror and TipTap workloads informed the decision to
  measure editing and presentation together rather than isolate JavaScript.
- Univer demonstrates realistic browser-office architecture: virtualized
  canvas/grid presentation, a separate formula engine, command-style
  operations, and deterministic workbook state. StillGood uses these
  architectural ideas without embedding Univer or its startup cost.
- miniPaint demonstrates practical browser-local creative workloads such as
  layer composition, resizing, filters, and export. A photo workflow is a
  strong future optional module, but it is not part of the Office score.

References:

- https://browserbench.org/Speedometer3.1/about.html
- https://github.com/WebKit/Speedometer
- https://github.com/dream-num/univer
- https://github.com/viliusle/miniPaint

No third-party benchmark or application code is copied into StillGood v4. The
fixtures are original deterministic implementations. Speedometer uses a
permissive BSD-style license, Univer uses Apache-2.0, and miniPaint uses MIT;
future direct reuse must preserve the applicable notices.

## Email workload

The test uses 1,000, 5,000, 20,000, 50,000, and 100,000-message mailboxes.
Only a realistic viewport is rendered, while search, sort, filter, and bulk
selection operate against the complete local mailbox.

Each measured journey performs:

1. Full-mailbox sender, subject, and body search.
2. Opening and laying out a long threaded conversation.
3. Sorting, selecting, and labeling a bulk message set.
4. Rendering a multi-block rich reply.
5. Switching folders.
6. Opening a locally generated HTML-newsletter-style message.

## Writing workload

The test uses documents of 1,500, 8,000, 25,000, 60,000, and 100,000 words.
They contain varied paragraphs, headings, formatting, and tables.

Each measured journey performs:

1. Initial document layout.
2. Find and highlight.
3. Editing near the beginning so following lines must move.
4. Narrowing the page to force full-document word wrapping.
5. Applying formatting across the document.
6. Inserting and laying out a table.
7. Serializing, reopening, and rerendering.

## Spreadsheet workload

The test uses 1,000, 10,000, 50,000, 150,000, and 400,000 populated cells.
Typed arrays hold the complete deterministic workbook while a virtualized grid
renders the current viewport.

Each measured journey performs:

1. Initial workbook calculation and display.
2. Editing an input and recalculating dependent formulas.
3. Sorting a large range.
4. Multi-column filtering.
5. Pasting and transforming a 1,000-cell block.
6. Workbook search.
7. Scrolling to a distant range.

## Measurement and scoring changes

- Every office tier receives a warm-up and five measured repetitions.
- Early-stopped levels are explicitly labeled rather than represented as
  ordinary measurements.
- Latency scores now interpolate continuously from median and worst-case
  duration. Comfortable, usable, limited, and failed remain explanatory labels,
  not the only scoring values.
- Email, writing, spreadsheets, and multitasking account for 70% of the
  composite weighting when all optional collectors are available.
- The result reports the highest comfortable and usable mailbox, word-count,
  and cell-count tiers separately.

## Remaining boundary

These are browser-office simulations, not Microsoft Office, Google Workspace,
LibreOffice, or Outlook. The browser cannot infer native-application
performance, total system memory pressure, thermals, or physical-drive
throughput. Capability labels remain experimental until calibrated against
physical devices and human comfort ratings.
