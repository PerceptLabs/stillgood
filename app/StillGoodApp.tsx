"use client";

import { useMemo, useRef, useState } from "react";
import { summarizePrototypeRun } from "@/lib/scoring.mjs";

type AppPhase = "landing" | "preparing" | "running" | "result";
type Scene = "inbox" | "documents" | "browsing" | "multitasking";
type Message = { sender: string; subject: string; time: string };
type ActionSample = {
  scene: Scene;
  action: string;
  durationMs: number;
  underPressure: boolean;
};
type PrototypeResult = ReturnType<typeof summarizePrototypeRun> & {
  samples: ActionSample[];
  browser: string;
  platform: string;
  startedAt: string;
  profileVersion: string;
};

const scenePlan: Array<{
  id: Scene;
  eyebrow: string;
  title: string;
  actions: string[];
}> = [
  {
    id: "inbox",
    eyebrow: "Everyday response",
    title: "Working through a practice inbox",
    actions: [
      "Opening a conversation",
      "Searching 400 messages",
      "Sorting by sender",
      "Expanding a thread",
      "Applying a label",
      "Drafting a reply",
      "Switching folders",
    ],
  },
  {
    id: "documents",
    eyebrow: "Documents & tables",
    title: "Editing a community device log",
    actions: [
      "Opening the document",
      "Finding a section",
      "Searching for battery inspection",
      "Sorting 500 inventory rows",
      "Editing a paragraph",
      "Recalculating the table",
      "Saving and reopening the draft",
    ],
  },
  {
    id: "browsing",
    eyebrow: "Local browsing workload",
    title: "Moving through everyday web pages",
    actions: [
      "Opening an article",
      "Filtering product cards",
      "Expanding an image",
      "Scrolling a comment thread",
      "Updating a dashboard",
      "Switching page panels",
      "Rendering search results",
    ],
  },
  {
    id: "multitasking",
    eyebrow: "Multitasking & recovery",
    title: "Overlapping foreground and background work",
    actions: [
      "Starting light background work",
      "Searching while work continues",
      "Switching active panels",
      "Updating document content",
      "Rendering an image grid",
      "Checking foreground response",
      "Stopping pressure and recovering",
    ],
  },
];

const messages: Message[] = Array.from({ length: 10 }, (_, index) => ({
  sender: [
    "River Street Library",
    "Mara Chen",
    "Repair Fair",
    "Device Intake",
    "Northside Workshop",
  ][index % 5],
  subject: [
    "Laptop pickup schedule",
    "Battery inspection notes",
    "Saturday volunteer list",
    "New donation received",
    "Parts inventory update",
  ][index % 5],
  time: `${9 + (index % 3)}:${index % 2 ? "45" : "20"}`,
}));

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const nextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

function deterministicMainThreadWork(seed: number, intensity: number) {
  const records = Array.from({ length: 220 * intensity }, (_, index) => ({
    id: index,
    score: (index * 9301 + seed * 49297) % 233280,
    text: `device-${(seed + index).toString(36)} inspection ready`,
  }));
  records.sort((a, b) => a.score - b.score);
  return records
    .filter((record) => record.score % 3 === 0 || record.text.includes("repair"))
    .reduce((sum, record) => sum + record.score, 0);
}

function browserLabel() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox/"))
    return `Firefox ${ua.split("Firefox/")[1].split(" ")[0]}`;
  if (ua.includes("Edg/"))
    return `Edge ${ua.split("Edg/")[1].split(" ")[0]}`;
  if (ua.includes("Chrome/"))
    return `Chromium ${ua.split("Chrome/")[1].split(" ")[0]}`;
  if (ua.includes("Safari/")) return "Safari";
  return "Current browser";
}

function IconMark({ kind }: { kind: "web" | "doc" | "remote" | "multi" }) {
  return <span className={`role-icon role-icon--${kind}`} aria-hidden="true" />;
}

export function StillGoodApp() {
  const [phase, setPhase] = useState<AppPhase>("landing");
  const [scene, setScene] = useState<Scene>("inbox");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [actionIndex, setActionIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusLine, setStatusLine] = useState("");
  const [result, setResult] = useState<PrototypeResult | null>(null);
  const [notice, setNotice] = useState("");
  const cancelledRef = useRef(false);
  const workersRef = useRef<Worker[]>([]);

  const currentScene = scenePlan[sceneIndex] ?? scenePlan[0];
  const activeMessages = useMemo(() => {
    const shift = actionIndex % messages.length;
    return [...messages.slice(shift), ...messages.slice(0, shift)];
  }, [actionIndex]);

  function stopTest() {
    cancelledRef.current = true;
    workersRef.current.forEach((worker) => {
      worker.postMessage({ type: "cancel" });
      worker.terminate();
    });
    workersRef.current = [];
    setPhase("landing");
    setNotice("Test stopped safely. No result was saved.");
  }

  async function beginTest() {
    cancelledRef.current = false;
    setNotice("");
    setResult(null);
    setPhase("preparing");
    setStatusLine("Checking browser timing and preparing local fixtures");
    const startedAt = new Date().toISOString();

    await sleep(500);
    if (cancelledRef.current) return;

    const frameIntervals: number[] = [];
    let previousFrame = 0;
    let collectingFrames = true;
    const collectFrame = (timestamp: number) => {
      if (previousFrame) frameIntervals.push(timestamp - previousFrame);
      previousFrame = timestamp;
      if (collectingFrames) requestAnimationFrame(collectFrame);
    };
    requestAnimationFrame(collectFrame);

    const longTasks: number[] = [];
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => longTasks.push(entry.duration));
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      observer = null;
    }

    await sleep(650);
    const calibrationFrames = frameIntervals.slice(0, 40).sort((a, b) => a - b);
    const cadenceMs =
      calibrationFrames[Math.floor(calibrationFrames.length / 2)] || 16.67;
    setStatusLine("Warm-up complete. The measured run is starting");
    await sleep(450);

    const samples: ActionSample[] = [];
    setPhase("running");

    for (let stageIndex = 0; stageIndex < scenePlan.length; stageIndex += 1) {
      if (cancelledRef.current) return;
      const stage = scenePlan[stageIndex];
      setSceneIndex(stageIndex);
      setScene(stage.id);
      setActionIndex(0);

      if (stage.id === "multitasking") {
        const workerCount = Math.max(
          1,
          Math.min(2, (navigator.hardwareConcurrency || 2) - 1),
        );
        workersRef.current = Array.from({ length: workerCount }, (_, index) => {
          const worker = new Worker("/benchmark-worker.js");
          worker.postMessage({
            type: "start",
            seed: 900 + index,
            workUnits: 3,
            durationMs: 5800,
          });
          return worker;
        });
      }

      for (let index = 0; index < stage.actions.length; index += 1) {
        if (cancelledRef.current) return;
        const action = stage.actions[index];
        setActionIndex(index);
        setStatusLine(action);
        const actionStart = performance.now();
        deterministicMainThreadWork(
          stageIndex * 17 + index,
          stage.id === "multitasking" ? 4 : 2,
        );
        setProgress(
          ((stageIndex * stage.actions.length + index + 0.35) /
            (scenePlan.length * stage.actions.length)) *
            100,
        );
        await nextPaint();
        samples.push({
          scene: stage.id,
          action,
          durationMs: performance.now() - actionStart,
          underPressure: stage.id === "multitasking" && index < 6,
        });
        setProgress(
          ((stageIndex * stage.actions.length + index + 1) /
            (scenePlan.length * stage.actions.length)) *
            100,
        );
        await sleep(170);
      }

      if (stage.id === "multitasking") {
        workersRef.current.forEach((worker) => {
          worker.postMessage({ type: "cancel" });
          worker.terminate();
        });
        workersRef.current = [];
      }
    }

    setStatusLine("Measuring recovery");
    const recoveryStart = performance.now();
    let stableProbes = 0;
    while (stableProbes < 5 && performance.now() - recoveryStart < 5000) {
      const probeStart = performance.now();
      await sleep(25);
      const lag = performance.now() - probeStart - 25;
      stableProbes = lag < 35 ? stableProbes + 1 : 0;
    }
    const recoveryMs = performance.now() - recoveryStart;

    collectingFrames = false;
    observer?.disconnect();
    const pressureDurations = samples
      .filter((sample) => sample.underPressure)
      .map((sample) => sample.durationMs);
    const baselineDurations = samples
      .filter((sample) => !sample.underPressure)
      .map((sample) => sample.durationMs);
    const summary = summarizePrototypeRun({
      actionDurations: baselineDurations,
      pressureDurations,
      frameIntervals,
      cadenceMs,
      recoveryMs,
      longTaskCount: longTasks.length,
      longTaskTotalMs: longTasks.reduce((sum, duration) => sum + duration, 0),
    });

    setResult({
      ...summary,
      samples,
      browser: browserLabel(),
      platform: navigator.platform || "Platform not reported",
      startedAt,
      profileVersion: "1.0.0-experimental / prototype slice",
    });
    setProgress(100);
    setPhase("result");
  }

  function downloadResult() {
    if (!result) return;
    const payload = {
      schemaVersion: "stillgood-prototype-result.v1",
      context: {
        browser: result.browser,
        platform: result.platform,
        startedAt: result.startedAt,
        profileVersion: result.profileVersion,
      },
      result,
      disclosure:
        "This result describes browser-observed behavior, not a system-wide hardware diagnosis.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stillgood-result-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (phase === "landing") {
    return (
      <main className="site-shell">
        <header className="topbar">
          <a className="brand" href="#" aria-label="StillGood home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>StillGood</span>
          </a>
          <nav aria-label="Site links">
            <a href="#method">How it works</a>
            <a href="#limits">What it measures</a>
          </nav>
          <span className="status-pill">Experimental preview</span>
        </header>

        {notice && <div className="notice" role="status">{notice}</div>}

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">A practical checkup for older computers</p>
            <h1>What can this computer <em>still do?</em></h1>
            <p className="hero-lede">
              One automated test recreates everyday web work, measures where
              responsiveness begins to break down, and gives you a useful answer.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={beginTest}>
                Run automated Quick Check
                <span aria-hidden="true">→</span>
              </button>
              <span className="duration-note">
                <strong>Prototype slice</strong>
                About 20 seconds
              </span>
            </div>
            <p className="run-note">
              Keep this tab visible and avoid using the computer until the run finishes.
            </p>
          </div>

          <div className="hero-card" aria-label="Example StillGood capability report">
            <div className="hero-card-topline">
              <span>Example result</span>
              <span className="confidence-dot">High confidence</span>
            </div>
            <div className="example-grade">
              <span className="grade-letter">B</span>
              <div>
                <strong>Useful secondary computer</strong>
                <p>Comfortable for everyday basics</p>
              </div>
            </div>
            <div className="example-meter" aria-hidden="true">
              <span style={{ width: "74%" }} />
            </div>
            <div className="example-rows">
              <div><span>Everyday response</span><strong>Comfortable</strong></div>
              <div><span>Light multitasking</span><strong>Usable</strong></div>
              <div><span>Heavy web apps</span><strong>One at a time</strong></div>
            </div>
            <p className="example-foot">Plain language first. Measured data underneath.</p>
          </div>
        </section>

        <section className="trust-row" aria-label="StillGood principles">
          <span><i aria-hidden="true" /> No account</span>
          <span><i aria-hidden="true" /> Local workloads</span>
          <span><i aria-hidden="true" /> Open methodology</span>
          <span><i aria-hidden="true" /> No mystery score</span>
        </section>

        <section className="method-section" id="method">
          <div>
            <p className="eyebrow">A benchmark with a point of view</p>
            <h2>Built around usefulness,<br />not bragging rights.</h2>
          </div>
          <div className="method-grid">
            <article>
              <span className="step-number">01</span>
              <h3>Recreates real work</h3>
              <p>Visible inbox, document, browsing, and overlapping-work simulations run automatically.</p>
            </article>
            <article>
              <span className="step-number">02</span>
              <h3>Finds the comfort limit</h3>
              <p>Work ramps carefully and stops before an old device is pointlessly overwhelmed.</p>
            </article>
            <article>
              <span className="step-number">03</span>
              <h3>Explains the result</h3>
              <p>See what is comfortable, what is usable, and what should be kept to one task at a time.</p>
            </article>
          </div>
        </section>

        <section className="limits-section" id="limits">
          <div className="limit-card limit-card--measure">
            <p className="eyebrow">Inside the browser</p>
            <h3>What this measures</h3>
            <p>Visible response delay, frame pacing, foreground response under pressure, long tasks, and recovery.</p>
          </div>
          <div className="limit-card limit-card--cannot">
            <p className="eyebrow">Honest boundaries</p>
            <h3>What it cannot see</h3>
            <p>Battery health, system temperature, total RAM pressure, boot speed, or every desktop application.</p>
          </div>
        </section>

        <footer>
          <span>StillGood · Experimental benchmark profile</span>
          <span>Respect old hardware. Measure what matters.</span>
        </footer>
      </main>
    );
  }

  if (phase === "preparing") {
    return (
      <main className="test-shell test-shell--prepare">
        <div className="test-brand"><span className="brand-mark">S</span> StillGood</div>
        <section className="prepare-card">
          <div className="prepare-rings" aria-hidden="true"><span /><span /><span /></div>
          <p className="eyebrow">Preparing the Quick Check</p>
          <h1>Establishing a fair baseline</h1>
          <p>{statusLine}…</p>
          <div className="prepare-list">
            <span>Local fixtures ready</span>
            <span>Browser capabilities checked</span>
            <span>Display cadence measuring</span>
          </div>
          <button className="text-button" onClick={stopTest}>Stop test</button>
        </section>
      </main>
    );
  }

  if (phase === "running") {
    return (
      <main className="test-shell">
        <header className="test-header">
          <div className="test-brand"><span className="brand-mark">S</span> StillGood</div>
          <div className="test-progress-label">
            <span>Automated Quick Check</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <button className="stop-button" onClick={stopTest}>Stop test</button>
        </header>
        <div className="progress-track" aria-label={`Test progress ${Math.round(progress)} percent`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <section className="run-layout">
          <div className="run-copy">
            <p className="eyebrow">{currentScene.eyebrow}</p>
            <h1>{currentScene.title}</h1>
            <p className="active-action"><span aria-hidden="true" />{statusLine}</p>
            <p className="run-guidance">
              StillGood is performing the actions. Leave this tab visible until the result appears.
            </p>
            <ol className="stage-list">
              {scenePlan.map((item, index) => (
                <li
                  key={item.id}
                  className={
                    index < sceneIndex ? "complete" : index === sceneIndex ? "active" : ""
                  }
                >
                  <span>{index < sceneIndex ? "✓" : index + 1}</span>
                  {item.eyebrow}
                </li>
              ))}
            </ol>
          </div>

          <div className="workload-window" aria-live="polite">
            <div className="window-bar">
              <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
              <span>{currentScene.eyebrow}</span>
              <span>Local fixture</span>
            </div>
            <WorkloadScene
              scene={scene}
              actionIndex={actionIndex}
              messages={activeMessages}
            />
          </div>
        </section>
      </main>
    );
  }

  if (!result) return null;

  const verdict =
    result.grade === "A"
      ? "Comfortable for the tested everyday workload."
      : result.grade === "B"
        ? "A useful secondary computer for everyday browser work."
        : result.grade === "C"
          ? "Worthwhile for focused, light-duty browser work."
          : "Best kept to one clear browser task at a time.";

  return (
    <main className="result-shell">
      <header className="topbar result-topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPhase("landing"); }}>
          <span className="brand-mark">S</span><span>StillGood</span>
        </a>
        <span className="status-pill">Experimental Quick Check</span>
      </header>

      <section className="result-hero">
        <div className="result-grade">{result.grade}</div>
        <div className="result-verdict">
          <p className="eyebrow">{result.label} · {result.score}/100 provisional</p>
          <h1>{verdict}</h1>
          <p>
            Comfortable workload: <strong>{result.comfortableWorkload}</strong>.
            Highest usable workload: <strong>{result.usableWorkload}</strong>.
          </p>
        </div>
        <div className="result-confidence">
          <span>Run confidence</span>
          <strong>Medium</strong>
          <small>Prototype modules only</small>
        </div>
      </section>

      <section className="roles-section">
        <p className="eyebrow">Good fit for</p>
        <div className="role-grid">
          {result.roles.length ? result.roles.map((role, index) => (
            <article key={role}>
              <IconMark kind={(["web", "doc", "remote", "multi"] as const)[index % 4]} />
              <span>{role}</span>
              <strong>Ready</strong>
            </article>
          )) : (
            <article>
              <IconMark kind="remote" />
              <span>Focused browser tasks</span>
              <strong>Use one at a time</strong>
            </article>
          )}
        </div>
      </section>

      <section className="metrics-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Measured in this browser</p>
            <h2>Useful numbers, with context.</h2>
          </div>
          <p>This prototype scores responsiveness, visual pacing, pressure response, and recovery.</p>
        </div>
        <div className="metrics-grid">
          <MetricCard
            label="Typical visible response"
            value={`${Math.round(result.p75)} ms`}
            status={result.p75 <= 200 ? "Comfortable" : result.p75 <= 500 ? "Usable" : "Frustrating"}
            note="75th percentile across automated actions"
          />
          <MetricCard
            label="Slower moments"
            value={`${Math.round(result.p95)} ms`}
            status={result.p95 <= 350 ? "Acceptable" : result.p95 <= 500 ? "Noticeable" : "Disruptive"}
            note="95th percentile; freezes matter here"
          />
          <MetricCard
            label="Response under pressure"
            value={`${Math.round(result.pressureP95)} ms`}
            status={result.pressureP95 <= 350 ? "Usable" : "Limited"}
            note="Foreground work while workers were active"
          />
          <MetricCard
            label="Frames delivered on time"
            value={`${Math.round(result.onTimeFrameRatio * 100)}%`}
            status={result.onTimeFrameRatio >= 0.9 ? "Mostly smooth" : "Visible hitches"}
            note={`${result.longTaskCount} long main-thread task${result.longTaskCount === 1 ? "" : "s"} observed`}
          />
          <MetricCard
            label="Recovery after pressure"
            value={`${Math.round(result.recoveryMs)} ms`}
            status={result.recoveryMs <= 1000 ? "Prompt" : result.recoveryMs <= 3000 ? "Usable" : "Slow"}
            note="Time until five stable event-loop probes"
          />
          <MetricCard
            label="Browser context"
            value={result.browser}
            status={result.platform}
            note="Results describe this computer-and-browser combination"
          />
        </div>
      </section>

      <section className="result-actions">
        <div>
          <p className="eyebrow">What this result means</p>
          <p>
            This is a working automation-first vertical slice. Documents, video,
            browser storage, offline repeat runs, and complete role gates come next.
          </p>
        </div>
        <div className="action-buttons">
          <button className="secondary-button" onClick={() => setPhase("landing")}>Run again</button>
          <button className="primary-button" onClick={downloadResult}>Export measured data</button>
        </div>
      </section>

      <details className="technical-details">
        <summary>Technical details and measurement disclosure</summary>
        <div>
          <p>Profile: {result.profileVersion}</p>
          <p>Started: {new Date(result.startedAt).toLocaleString()}</p>
          <p>Actions measured: {result.samples.length}</p>
          <p>
            These measurements describe browser-observed presentation and event-loop behavior.
            They do not diagnose CPU, RAM, storage hardware, thermals, or battery health.
          </p>
        </div>
      </details>
    </main>
  );
}

function MetricCard({
  label,
  value,
  status,
  note,
}: {
  label: string;
  value: string;
  status: string;
  note: string;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{status}</em>
      <p>{note}</p>
    </article>
  );
}

function WorkloadScene({
  scene,
  actionIndex,
  messages: sceneMessages,
}: {
  scene: Scene;
  actionIndex: number;
  messages: Message[];
}) {
  if (scene === "documents") {
    return (
      <div className="scene scene--document">
        <aside>
          <span className="mini-label">Community device log</span>
          {["Overview", "Device intake", "Battery inspection", "Inventory"].map((item, index) => (
            <i key={item} className={index === actionIndex % 4 ? "selected" : ""}>{item}</i>
          ))}
        </aside>
        <div className="document-page">
          <span className="mini-label">DEVICE INTAKE · 2026</span>
          <h3>Refurbishment field notes</h3>
          <p className="text-lines"><i /><i /><i /><i /></p>
          <div className="fake-table">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} className={index === actionIndex % 5 ? "highlighted" : ""}>
                <i /> <i /> <i />
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scene === "browsing") {
    return (
      <div className="scene scene--browse">
        <div className="browse-tabs">
          {["Article", "Products", "Map", "Comments"].map((item, index) => (
            <span key={item} className={index === actionIndex % 4 ? "selected" : ""}>{item}</span>
          ))}
        </div>
        <div className="card-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <article key={index} className={index === actionIndex % 9 ? "active" : ""}>
              <span className="card-image" />
              <i />
              <i />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (scene === "multitasking") {
    return (
      <div className="scene scene--multi">
        <div className="multi-grid">
          {["Inbox", "Document", "Search", "Background work"].map((item, index) => (
            <article key={item} className={index === actionIndex % 4 ? "active" : ""}>
              <span>{item}</span>
              <div className="activity-bars">
                <i style={{ width: `${42 + ((actionIndex + index) * 13) % 48}%` }} />
                <i style={{ width: `${35 + ((actionIndex + index) * 9) % 52}%` }} />
                <i style={{ width: `${55 + ((actionIndex + index) * 7) % 38}%` }} />
              </div>
            </article>
          ))}
        </div>
        <div className="pressure-readout">
          <span>Controlled background pressure</span>
          <strong>{actionIndex < 2 ? "Light" : actionIndex < 5 ? "Moderate" : "Recovering"}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="scene scene--inbox">
      <aside>
        <button className="compose-chip">＋ Compose</button>
        {["Inbox", "Starred", "Sent", "Archive"].map((item, index) => (
          <span key={item} className={index === actionIndex % 4 ? "selected" : ""}>{item}</span>
        ))}
      </aside>
      <div className="inbox-list">
        <div className="inbox-toolbar">
          <span className="fake-search">Search: repair fair</span>
          <span>{sceneMessages.length} messages</span>
        </div>
        {sceneMessages.slice(0, 7).map((message, index) => (
          <div key={`${message.sender}-${index}`} className={index === actionIndex % 7 ? "active" : ""}>
            <i aria-hidden="true" />
            <strong>{message.sender}</strong>
            <span>{message.subject}</span>
            <time>{message.time}</time>
          </div>
        ))}
      </div>
    </div>
  );
}
