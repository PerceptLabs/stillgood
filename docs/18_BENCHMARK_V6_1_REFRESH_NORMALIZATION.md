# Benchmark v6.1: refresh-normalized graphics

## Problem

The v6 graphics module rendered its fixed scene on every display refresh and
judged lateness relative to the display's native frame interval. A 144 Hz
display therefore requested more than twice as many scene renders as a 60 Hz
display and allowed roughly seven milliseconds per frame instead of roughly
seventeen. A faster computer could receive a worse result simply because it was
connected to a higher-refresh display.

## Decision

The everyday graphics grade now uses a fixed 60 fps usability target:

- Displays at 60 Hz or above are evaluated against a 16.67 ms target.
- Lower-refresh displays use their measured native cadence because the browser
  cannot present frames faster than the display.
- Scene rendering is scheduled at the evaluation cadence rather than on every
  native refresh callback.
- Delivered scene frames are compared with the number expected during the
  fixed measurement window.
- Frames longer than 50 ms remain separately recorded as disruptive stalls.

Native display cadence remains in the exported evidence, along with the
evaluation cadence and expected frame count. This preserves diagnostic context
without allowing refresh rate alone to lower the usability grade.

## Scope

This changes graphics workload scheduling and graphics measurement only. It
does not remove the graphics category or weaken the grade guardrails for
machines that genuinely fail ordinary 60 fps visual work.

## Profile identifier

`6.1.0-refresh-normalized-graphics`
