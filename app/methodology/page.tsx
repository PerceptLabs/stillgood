import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Testing methodology",
  description:
    "How StillGood recreates everyday browser work, measures responsiveness and reserve, and turns the evidence into practical guidance.",
};

const modules = [
  {
    name: "Browsing",
    work: "Operates deterministic article, search, shopping, navigation, filtering, and image-grid fixtures.",
    evidence: "Rendered-action latency, tail delays, hitches, and maximum usable workload.",
  },
  {
    name: "Email",
    work: "Searches, sorts, opens, labels, and composes in a local inbox-style application.",
    evidence: "Everyday response plus separately reported reserve at extended workloads.",
  },
  {
    name: "Documents",
    work: "Edits and reformats long text, tables, images, and layout-sensitive content that forces wrapping and reflow.",
    evidence: "Edit-to-paint latency, layout cost, search, formatting, and recovery.",
  },
  {
    name: "Spreadsheets",
    work: "Recalculates formulas, sorts, filters, pastes, searches, and scrolls increasingly large tables.",
    evidence: "Operation latency, visible-update latency, hitches, and capacity.",
  },
  {
    name: "Multitasking",
    work: "Keeps the foreground interface active while worker calculations and other browser work overlap.",
    evidence: "Foreground lag, long frames, task switching, and recovery after pressure.",
  },
  {
    name: "Visuals",
    work: "Draws and moves deterministic Canvas content at increasing complexity.",
    evidence: "Frame delivery against a common 60 fps target, long frames, and dense-scene reserve.",
  },
  {
    name: "Video",
    work: "Plays bundled H.264 clips at 480p, 720p, and 1080p without relying on the network.",
    evidence: "Displayed and dropped frames, media progress, total waiting time, and longest interruption.",
  },
  {
    name: "Memory pressure",
    work: "Allocates, touches, and repeatedly sweeps bounded working sets in a worker while probing foreground response.",
    evidence: "Allocation and sweep behavior, foreground tail latency, and recovery—not installed RAM.",
  },
  {
    name: "Persistent saves",
    work: "Commits IndexedDB transactions and writes, flushes, reopens, randomly reads, and verifies local OPFS files.",
    evidence: "Small-save latency, large-file flush tails, data integrity, and foreground lag.",
  },
];

const gradeBands = [
  ["98–100", "A+", "Modern-fast"],
  ["94–97", "A", "Fast"],
  ["90–93", "A−", "Very capable"],
  ["86–89", "B+", "Strong second-life"],
  ["82–85", "B", "Comfortable second-life"],
  ["78–81", "B−", "Useful second-life"],
  ["74–77", "C+", "Capable light-use"],
  ["68–73", "C", "Light-use"],
  ["58–67", "C−", "Focused-use"],
  ["45–57", "D", "Single-purpose"],
  ["0–44", "E", "Struggling"],
];

export default function MethodologyPage() {
  return (
    <main className="methodology-shell">
      <header className="simple-header methodology-header">
        <Link className="simple-brand" href="/" aria-label="StillGood home">
          <span>S</span> StillGood
        </Link>
        <div className="header-actions">
          <a
            className="header-link source-header-link"
            href="https://github.com/PerceptLabs/stillgood"
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
          <Link className="header-link" href="/">
            Run the test
          </Link>
        </div>
      </header>

      <article className="methodology-paper">
        <header className="methodology-hero">
          <p className="kicker">Methodology whitepaper · benchmark v6.13</p>
          <h1>Measuring what a computer is still good for</h1>
          <p>
            StillGood is a browser-based system-usability benchmark for older,
            repaired, low-power, and second-life computers. It recreates
            recognizable work, measures where visible response begins to break
            down, and reports useful roles and limits instead of relying on one
            unexplained speed number.
          </p>
          <div className="methodology-meta">
            <span>Profile 6.13.0</span>
            <span>Published July 2026</span>
            <a href="/stillgood-methodology-v6.13.md" download>
              Download Markdown
            </a>
            <a
              href="https://github.com/PerceptLabs/stillgood"
              target="_blank"
              rel="noreferrer"
            >
              View source on GitHub
            </a>
          </div>
        </header>

        <nav className="methodology-toc" aria-label="Whitepaper contents">
          <strong>Contents</strong>
          <a href="#question">The question</a>
          <a href="#protocol">Protocol</a>
          <a href="#workloads">Workloads</a>
          <a href="#measurement">Measurement</a>
          <a href="#scoring">Scoring</a>
          <a href="#validity">Validity</a>
          <a href="#references">References</a>
        </nav>

        <section id="question">
          <p className="paper-number">01</p>
          <h2>The question is usefulness, not prestige</h2>
          <p>
            Conventional benchmarks compare peak execution speed or
            browser-engine throughput. They do not directly answer whether a
            particular computer remains comfortable for email, documents,
            spreadsheets, video, and modest multitasking.
          </p>
          <p>
            StillGood measures a computer-and-browser combination. Its primary
            observations are human-visible delay, consistency, frame delivery,
            recovery, and the highest workload that remains comfortable or
            usable. A slow device is not treated as worthless: the report
            identifies the jobs it can still perform well.
          </p>
          <aside className="paper-callout">
            <strong>Core claim</strong>
            <p>
              StillGood does not estimate abstract hardware power. It measures
              how this browser presents controlled everyday work on this
              computer, in this configuration, at this moment.
            </p>
          </aside>
        </section>

        <section id="protocol">
          <p className="paper-number">02</p>
          <h2>A controlled, automatic protocol</h2>
          <ol className="methodology-steps">
            <li>
              <strong>Preflight and cache</strong>
              <span>
                Confirm visibility, load local fixtures, establish display
                cadence, and sample idle response.
              </span>
            </li>
            <li>
              <strong>Warm and repeat</strong>
              <span>
                Repeat deterministic journeys so one cold start or scheduler
                interruption cannot dominate.
              </span>
            </li>
            <li>
              <strong>Increase gradually</strong>
              <span>
                Run ordinary tiers first. Only a fast, stable device proceeds
                into extended reserve tiers.
              </span>
            </li>
            <li>
              <strong>Stop safely</strong>
              <span>
                End early when delays become severe instead of freezing weak
                hardware merely to quantify failure.
              </span>
            </li>
            <li>
              <strong>Recover and explain</strong>
              <span>
                Measure recovery, then translate the evidence into roles,
                cautions, a score, and a grade.
              </span>
            </li>
          </ol>
          <p>
            The page should remain focused and the device should be left alone
            during the run. Background tabs, extensions, other programs,
            thermal state, and power policy can materially change a result.
          </p>
        </section>

        <section id="workloads">
          <p className="paper-number">03</p>
          <h2>What the benchmark actually does</h2>
          <div className="methodology-table-wrap">
            <table className="methodology-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Controlled work</th>
                  <th>Evidence retained</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.name}>
                    <th>{module.name}</th>
                    <td>{module.work}</td>
                    <td>{module.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            All application fixtures and media are bundled with StillGood.
            Network speed, advertisements, analytics scripts, and changing
            third-party websites are excluded from measured modules.
          </p>
        </section>

        <section id="measurement">
          <p className="paper-number">04</p>
          <h2>From scripted action to visible result</h2>
          <p>
            Scripted journeys perform real JavaScript, DOM updates, style
            calculation, layout, text wrapping, painting, Canvas work, worker
            communication, media decoding, and browser storage operations.
            Timing uses the browser&apos;s monotonic high-resolution clock.
          </p>
          <div className="evidence-grid">
            <article>
              <strong>Central tendency</strong>
              <p>
                Medians describe normal experience without letting one
                interruption define the run.
              </p>
            </article>
            <article>
              <strong>Tail latency</strong>
              <p>
                75th, 95th, 99th, and worst observations expose catch-up
                pauses that averages conceal.
              </p>
            </article>
            <article>
              <strong>Visible completion</strong>
              <p>
                Rendered actions include the opportunity to present an update,
                not merely synchronous JavaScript.
              </p>
            </article>
            <article>
              <strong>Congestion</strong>
              <p>
                Long tasks, long animation frames, timer probes, and frame
                delivery reveal blocked foreground response.
              </p>
            </article>
          </div>

          <h3>Browser-neutral compatibility adapters</h3>
          <p>
            Browsers can emit media lifecycle events at slightly different
            moments. StillGood records the total and longest period between a
            post-start <code>waiting</code> event and resumed playback. A brief
            event under 100 milliseconds does not become a visible stall by
            itself. Dropped frames, media-time advancement, completion, and
            delivered-frame counts remain independent checks.
          </p>
          <p>
            Repeated user-facing text sorts derive alphabetical ranks once
            from the fixture&apos;s unique labels using a fixed-locale
            <code>Intl.Collator</code>. Timed large-array sorts compare those
            ranks. This avoids repeatedly initializing collation while
            preserving the same ordering, data, actions, and scoring thresholds
            in every browser. Adapters correct invocation or observation
            differences; they never multiply a score based on the browser name.
          </p>
          <h3>Browser evidence boundary</h3>
          <p>
            Browser-visible work remains part of the measured Web Experience.
            Browsing, webmail, documents, spreadsheets, multitasking, visuals,
            video, consistency, and web workload reserve can therefore differ
            between Firefox and Chromium when the actual experience differs.
          </p>
          <p>
            Active-memory pressure, persistent storage, and recovery form
            Resource Resilience. Compatibility adapters may ensure equal work
            or equivalent observation, but no browser receives a multiplier,
            offset, cap exception, or threshold change after measurement.
            Chromium is the reference path; Firefox support is experimental.
          </p>

          <h3>Everyday capability and performance reserve</h3>
          <p>
            Normal through demanding tiers determine whether a core activity
            is practically usable. Extended and maximum tiers measure reserve.
            They still influence weighted evidence and the reserve label, but
            they cannot alone trigger the hard minimum intended for everyday
            capability.
          </p>
        </section>

        <section id="scoring">
          <p className="paper-number">05</p>
          <h2>Scoring and interpretation</h2>
          <p>
            Each tier combines typical journey time, worst repeated journey
            time, action-level tail latency, hitch frequency, and variability.
            Continuous curves preserve differences inside the broad
            comfortable, usable, limited, and failed descriptions.
          </p>
          <div className="score-weight-grid">
            <span><strong>22</strong>browsing</span>
            <span><strong>17</strong>multitasking</span>
            <span><strong>13</strong>visuals</span>
            <span><strong>12</strong>video</span>
            <span><strong>10</strong>spreadsheets</span>
            <span><strong>9</strong>email</span>
            <span><strong>9</strong>documents</span>
            <span><strong>8</strong>consistency</span>
            <span><strong>5</strong>recovery</span>
          </div>
          <p className="paper-note">
            Relative weights are renormalized when an optional measurement is
            unavailable. Memory and storage can lower a result when they expose
            a practical limit, but they do not boost the base score merely for
            being fast.
          </p>
          <p>
            Category evidence is combined with a weighted geometric mean so a
            serious weakness cannot be hidden by several perfect categories.
            Explicit caps cover weak core work, poor everyday graphics or
            video, inconsistent response, limited reserve, and slow persistent
            saves. The exported report retains the underlying observations and
            profile version.
          </p>
          <p>
            Version 6.13 applies no post-score browser normalization. Web
            Experience keeps real browser differences, while Resource
            Resilience uses equal-work compatibility methods. Changing only a
            stored browser-family label cannot change the result.
          </p>

          <div className="methodology-table-wrap compact-table">
            <table className="methodology-table">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {gradeBands.map(([score, grade, meaning]) => (
                  <tr key={grade}>
                    <td>{score}</td>
                    <th>{grade}</th>
                    <td>{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="validity">
          <p className="paper-number">06</p>
          <h2>What makes the result meaningful</h2>
          <ul className="paper-list">
            <li>
              <strong>Representative mechanisms:</strong> DOM mutation, layout,
              text reflow, table work, Canvas, media, workers, and persistent
              browser storage are used by real web applications.
            </li>
            <li>
              <strong>Deterministic inputs:</strong> fixed local datasets and
              assets support repeat runs and cross-device comparisons.
            </li>
            <li>
              <strong>Multiple dimensions:</strong> typical speed, tails,
              smoothness, overlap, capacity, and recovery prevent one narrow
              microbenchmark from defining usefulness.
            </li>
            <li>
              <strong>Adaptive headroom:</strong> fast devices receive enough
              work to reveal limits while weak devices can stop safely.
            </li>
            <li>
              <strong>Versioned calibration:</strong> methodology changes
              create a new profile, with paired physical-device runs used to
              check separation and unintended regressions.
            </li>
          </ul>

          <h3>Important boundaries</h3>
          <p>
            StillGood cannot directly measure boot time, battery condition,
            temperature, total operating-system memory pressure, raw physical
            disk throughput, every native desktop application, or internet
            quality. Browser storage is not presented as an SSD benchmark, and
            an active-memory workload is not presented as installed RAM.
          </p>
          <p>
            Results can vary with browser engine, extensions, hardware
            acceleration, background programs, power policy, heat, and update
            activity. Comparisons should use the same profile and similar run
            conditions.
          </p>
        </section>

        <section id="references">
          <p className="paper-number">07</p>
          <h2>Standards and methodological references</h2>
          <ul className="reference-list">
            <li>
              <a href="https://browserbench.org/Speedometer3.0/about.html">Speedometer 3 methodology</a>
              {" "}— simulated interactions and holistic web-application response.
            </li>
            <li>
              <a href="https://browserbench.org/Speedometer3.0/instructions.html">Speedometer instructions</a>
              {" "}— focus, profiles, background work, power, and thermal state.
            </li>
            <li>
              <a href="https://browserbench.org/announcements/speedometer3.1/">Speedometer 3.1 corrections</a>
              {" "}— equal work across browsers and complete measurement of asynchronous work.
            </li>
            <li>
              <a href="https://www.principledtechnologies.com/benchmarkxprt/webxprt/faq">WebXPRT FAQ</a>
              {" "}— repeated scenarios, confidence, and device-and-browser interpretation.
            </li>
            <li>
              <a href="https://www.principledtechnologies.com/benchmarkxprt/counter.php?inline=true&amp;redirect=%2Fbenchmarkxprt%2Fwhitepapers%2Fwebxprt%2FWebXPRT-4-results-calculation.pdf">WebXPRT results calculation</a>
              {" "}— ratios to a fixed calibration system, geometric means, outlier handling, and confidence intervals.
            </li>
            <li>
              <a href="https://browserbench.org/MotionMark/about.html">MotionMark methodology</a>
              {" "}— adaptive graphics complexity and browser-dependent frame scheduling.
            </li>
            <li>
              <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare">Locale-aware sorting guidance</a>
              {" "}— reuse an <code>Intl.Collator</code> when sorting large arrays.
            </li>
            <li>
              <a href="https://web.dev/articles/inp">Interaction to Next Paint</a>
              {" "}— visible responsiveness and 200/500 ms reference anchors.
            </li>
            <li>
              <a href="https://www.w3.org/TR/longtasks-1/">W3C Long Tasks</a>
              {" "}and{" "}
              <a href="https://www.w3.org/TR/long-animation-frames/">Long Animation Frames</a>
              {" "}— main-thread congestion and rendering delay.
            </li>
            <li>
              <a href="https://w3c.github.io/media-playback-quality/">Media Playback Quality</a>
              {" "}— total and dropped video-frame semantics.
            </li>
            <li>
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback">requestVideoFrameCallback</a>
              {" "}— observing frames sent to the compositor.
            </li>
            <li>
              <a href="https://fs.spec.whatwg.org/">WHATWG File System Standard</a>
              {" "}— origin-private file access, flush, reopen, and verification.
            </li>
            <li>
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability">IndexedDB durability</a>
              {" "}— strict and relaxed commit semantics.
            </li>
          </ul>
        </section>

        <footer className="methodology-footer">
          <div>
            <strong>StillGood methodology v6.13</strong>
            <span>
              Designed to support informed second-life hardware decisions.
            </span>
          </div>
          <Link className="primary-action methodology-run" href="/">
            Run StillGood
          </Link>
        </footer>
      </article>
    </main>
  );
}
