"use client";

import { useRef, useState } from "react";
import { summarizeFastRun } from "@/lib/scoring.mjs";

type AppPhase = "home" | "prepare" | "run" | "result";
type StageId = "everyday" | "documents" | "media" | "multitasking" | "storage";
type Tier = "baseline" | "light" | "moderate" | "heavy";
type Sample = {
  stage: StageId;
  tier: Tier;
  durationMs: number;
  workMs: number;
  underPressure: boolean;
};
type FastResult = ReturnType<typeof summarizeFastRun> & {
  browser: string;
  platform: string;
  startedAt: string;
  samples: Sample[];
  elapsedMs: number;
  profileVersion: string;
};

const stages: Array<{
  id: StageId;
  name: string;
  title: string;
  detail: string;
}> = [
  {
    id: "everyday",
    name: "Everyday use",
    title: "Testing everyday responsiveness",
    detail: "Opening, searching, sorting, and updating an inbox-style app.",
  },
  {
    id: "documents",
    name: "Documents",
    title: "Testing documents and search",
    detail: "Editing text, sorting a table, searching, and redrawing content.",
  },
  {
    id: "media",
    name: "Motion & video",
    title: "Testing motion and video",
    detail: "Checking frame pacing and playing a cached local video.",
  },
  {
    id: "multitasking",
    name: "Multitasking",
    title: "Testing work under pressure",
    detail: "Repeating foreground work while bounded background tasks run.",
  },
  {
    id: "storage",
    name: "Storage & recovery",
    title: "Testing browser storage and recovery",
    detail: "Saving temporary local data, reading it back, and cleaning up.",
  },
];

const tierSizes: Array<{ tier: Tier; size: number }> = [
  { tier: "baseline", size: 900 },
  { tier: "light", size: 2800 },
  { tier: "moderate", size: 8500 },
  { tier: "heavy", size: 24000 },
];

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const nextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

function deterministicWork(seed: number, size: number) {
  let value = seed >>> 0;
  const rows = Array.from({ length: size }, (_, index) => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return {
      id: index,
      score: value % 100000,
      label: `device-${value.toString(36)} battery inspection`,
    };
  });
  rows.sort((a, b) => a.score - b.score || a.id - b.id);
  const filtered = rows.filter(
    (row) => row.score % 3 === 0 || row.label.includes("repair"),
  );
  return filtered.reduce((checksum, row) => checksum ^ row.score, 0);
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

async function runStorage(): Promise<{ writeMs: number; readMs: number }> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("stillgood-fast-check", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("blocks"))
        database.createObjectStore("blocks");
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const block = new Uint8Array(256 * 1024);
      for (let index = 0; index < block.length; index += 4096)
        block[index] = index % 251;

      const writeStart = performance.now();
      const write = database.transaction("blocks", "readwrite");
      const store = write.objectStore("blocks");
      for (let index = 0; index < 24; index += 1)
        store.put(block, `block-${index}`);

      write.onerror = () => {
        database.close();
        reject(write.error);
      };
      write.oncomplete = () => {
        const writeMs = performance.now() - writeStart;
        const readStart = performance.now();
        const read = database.transaction("blocks", "readonly");
        const readStore = read.objectStore("blocks");
        for (let index = 0; index < 8; index += 1)
          readStore.get(`block-${index * 3}`);

        read.onerror = () => {
          database.close();
          reject(read.error);
        };
        read.oncomplete = () => {
          const readMs = performance.now() - readStart;
          database.close();
          const deletion = indexedDB.deleteDatabase("stillgood-fast-check");
          deletion.onsuccess = () => resolve({ writeMs, readMs });
          deletion.onerror = () => resolve({ writeMs, readMs });
        };
      };
    };
  });
}

export function StillGoodApp() {
  const [phase, setPhase] = useState<AppPhase>("home");
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [visualTick, setVisualTick] = useState(0);
  const [result, setResult] = useState<FastResult | null>(null);
  const [notice, setNotice] = useState("");
  const cancelledRef = useRef(false);
  const workersRef = useRef<Worker[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stage = stages[stageIndex] ?? stages[0];

  function stop() {
    cancelledRef.current = true;
    workersRef.current.forEach((worker) => {
      worker.postMessage({ type: "cancel" });
      worker.terminate();
    });
    workersRef.current = [];
    videoRef.current?.pause();
    setPhase("home");
    setNotice("Test stopped safely. Nothing was saved.");
  }

  async function measureAction(
    stageId: StageId,
    tier: Tier,
    size: number,
    seed: number,
    underPressure: boolean,
  ): Promise<Sample> {
    const start = performance.now();
    const workStart = performance.now();
    deterministicWork(seed, size);
    const workMs = performance.now() - workStart;
    setVisualTick((value) => value + 1);
    await nextPaint();
    return {
      stage: stageId,
      tier,
      durationMs: performance.now() - start,
      workMs,
      underPressure,
    };
  }

  async function begin() {
    cancelledRef.current = false;
    setNotice("");
    setResult(null);
    setProgress(0);
    setPhase("prepare");
    setStatus("Loading the five local checks");
    const startedAt = new Date().toISOString();
    const testStart = performance.now();

    try {
      await fetch("/benchmark-assets/flower.mp4", { cache: "force-cache" }).then(
        (response) => {
          if (!response.ok) throw new Error("Video fixture unavailable");
          return response.arrayBuffer();
        },
      );
    } catch {
      // Video can degrade gracefully; its result will be unavailable.
    }

    const frameIntervals: number[] = [];
    let collectingFrames = true;
    let previousFrame = 0;
    const frameLoop = (timestamp: number) => {
      if (previousFrame) frameIntervals.push(timestamp - previousFrame);
      previousFrame = timestamp;
      if (collectingFrames) requestAnimationFrame(frameLoop);
    };
    requestAnimationFrame(frameLoop);

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

    setStatus("Measuring this display and warming up");
    deterministicWork(7, 1200);
    await sleep(850);
    if (cancelledRef.current) return;
    const calibration = frameIntervals.slice(0, 45).sort((a, b) => a - b);
    const cadenceMs = calibration[Math.floor(calibration.length / 2)] || 16.67;

    const samples: Sample[] = [];
    setPhase("run");

    setStageIndex(0);
    setStatus("Ramping from a simple inbox to a busy one");
    for (let index = 0; index < tierSizes.length; index += 1) {
      const item = tierSizes[index];
      for (let repeat = 0; repeat < 2; repeat += 1) {
        if (cancelledRef.current) return;
        samples.push(
          await measureAction(
            "everyday",
            item.tier,
            item.size,
            index * 11 + repeat,
            false,
          ),
        );
        setProgress(5 + index * 4 + repeat * 2);
        await sleep(180);
      }
    }

    setStageIndex(1);
    setStatus("Searching, editing, and sorting a larger document");
    for (let index = 0; index < 6; index += 1) {
      if (cancelledRef.current) return;
      const item = tierSizes[Math.min(3, Math.floor(index / 2) + 1)];
      samples.push(
        await measureAction(
          "documents",
          item.tier,
          item.size + index * 700,
          70 + index,
          false,
        ),
      );
      setProgress(24 + index * 3);
      await sleep(220);
    }

    setStageIndex(2);
    setStatus("Checking animation cadence");
    const mediaFrameStart = frameIntervals.length;
    for (let index = 0; index < 18; index += 1) {
      if (cancelledRef.current) return;
      setVisualTick((value) => value + 1);
      setProgress(42 + index * 0.55);
      await sleep(150);
    }

    let videoDroppedRatio: number | null = null;
    let videoStalls = 0;
    setStatus("Playing cached video");
    await nextPaint();
    const video = videoRef.current;
    if (video) {
      const onWaiting = () => {
        videoStalls += 1;
      };
      video.addEventListener("waiting", onWaiting);
      try {
        video.currentTime = 0;
        video.muted = true;
        const before = video.getVideoPlaybackQuality?.();
        await video.play();
        await sleep(6200);
        video.pause();
        const after = video.getVideoPlaybackQuality?.();
        if (before && after) {
          const total = after.totalVideoFrames - before.totalVideoFrames;
          const dropped = after.droppedVideoFrames - before.droppedVideoFrames;
          videoDroppedRatio = total > 0 ? dropped / total : null;
        }
      } catch {
        videoDroppedRatio = null;
      } finally {
        video.removeEventListener("waiting", onWaiting);
      }
    }
    setProgress(62);

    setStageIndex(3);
    setStatus("Keeping foreground work responsive during background work");
    const workerCount = Math.max(
      1,
      Math.min(4, (navigator.hardwareConcurrency || 2) - 1),
    );
    workersRef.current = Array.from({ length: workerCount }, (_, index) => {
      const worker = new Worker("/benchmark-worker.js");
      worker.postMessage({
        type: "start",
        seed: 400 + index,
        workUnits: 8,
        durationMs: 8000,
      });
      return worker;
    });
    for (let index = 0; index < 8; index += 1) {
      if (cancelledRef.current) return;
      const item = tierSizes[Math.min(3, Math.floor(index / 2))];
      samples.push(
        await measureAction(
          "multitasking",
          item.tier,
          item.size,
          120 + index,
          true,
        ),
      );
      setProgress(64 + index * 3);
      await sleep(520);
    }
    workersRef.current.forEach((worker) => {
      worker.postMessage({ type: "cancel" });
      worker.terminate();
    });
    workersRef.current = [];

    setStageIndex(4);
    setStatus("Saving and reading a temporary 6 MB dataset");
    let storageWriteMs = 6000;
    let storageReadMs = 6000;
    try {
      const storage = await runStorage();
      storageWriteMs = storage.writeMs;
      storageReadMs = storage.readMs;
    } catch {
      // Unsupported or blocked storage remains a clear low-confidence result.
    }
    setProgress(93);

    setStatus("Checking how quickly normal response returns");
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
    const mediaFrames = frameIntervals.slice(mediaFrameStart);
    const actionDurations = samples
      .filter((sample) => !sample.underPressure)
      .map((sample) => sample.durationMs);
    const pressureDurations = samples
      .filter((sample) => sample.underPressure)
      .map((sample) => sample.durationMs);
    const summary = summarizeFastRun({
      actionDurations,
      pressureDurations,
      workDurations: samples.map((sample) => sample.workMs),
      frameIntervals: mediaFrames,
      cadenceMs,
      recoveryMs,
      videoDroppedRatio,
      videoStalls,
      storageWriteMs,
      storageReadMs,
      longTaskCount: longTasks.length,
      highestTierCompleted: "heavy",
    });

    setResult({
      ...summary,
      browser: browserLabel(),
      platform: navigator.platform || "Platform not reported",
      startedAt,
      samples,
      elapsedMs: performance.now() - testStart,
      profileVersion: "1.1.0-experimental-fast-check",
    });
    setProgress(100);
    setPhase("result");
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schemaVersion: "stillgood-fast-result.v1",
            result,
            disclosure:
              "This describes browser-observed behavior, not a system-wide hardware diagnosis.",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stillgood-fast-check-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (phase === "home") {
    return (
      <main className="simple-shell">
        <header className="simple-header">
          <a className="simple-brand" href="#" aria-label="StillGood home">
            <span>S</span> StillGood
          </a>
          <span className="experimental-label">Experimental</span>
        </header>

        {notice && <p className="simple-notice" role="status">{notice}</p>}

        <section className="simple-hero">
          <p className="kicker">A fast check for older computers</p>
          <h1>Is this computer still good?</h1>
          <p className="simple-lede">
            One automatic test. About 30 seconds. A clear answer about browsing,
            documents, video, and multitasking.
          </p>
          <button className="start-button" onClick={begin}>
            Start the test <span aria-hidden="true">→</span>
          </button>
          <p className="quiet-instruction">
            Keep this tab visible and leave the computer alone until it finishes.
          </p>
        </section>

        <section className="five-checks" aria-label="The five checks">
          {stages.map((item, index) => (
            <article key={item.id}>
              <span>{index + 1}</span>
              <strong>{item.name}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="plain-boundary">
          <strong>What you get</strong>
          <p>
            Comfortable, usable, or limited for each area—plus the highest
            workload this browser handled well.
          </p>
          <strong>What it cannot see</strong>
          <p>
            Battery health, temperature, boot time, or performance in every
            desktop application.
          </p>
        </section>

        <footer className="simple-footer">
          <span>No account · local test files · open method</span>
          <span>Results describe this computer and browser together.</span>
        </footer>
      </main>
    );
  }

  if (phase === "prepare") {
    return (
      <main className="run-shell">
        <header className="run-header">
          <span className="simple-brand"><i>S</i> StillGood</span>
          <button onClick={stop}>Stop</button>
        </header>
        <section className="prepare-view">
          <div className="pulse-mark" aria-hidden="true" />
          <p className="kicker">Getting ready</p>
          <h1>{status}</h1>
          <p>Downloads and warm-up are not included in the score.</p>
        </section>
      </main>
    );
  }

  if (phase === "run") {
    return (
      <main className="run-shell">
        <header className="run-header">
          <span className="simple-brand"><i>S</i> StillGood</span>
          <span>{Math.round(progress)}%</span>
          <button onClick={stop}>Stop</button>
        </header>
        <div className="thin-progress"><span style={{ width: `${progress}%` }} /></div>

        <section className="run-main">
          <div
            className="progress-orbit"
            style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
            aria-label={`${Math.round(progress)} percent complete`}
          >
            <strong>{stageIndex + 1}</strong>
            <span>of 5</span>
          </div>
          <div className="run-message">
            <p className="kicker">{stage.name}</p>
            <h1>{stage.title}</h1>
            <p>{stage.detail}</p>
            <div className="current-status"><i /> {status}</div>
          </div>
          <BenchmarkVisual
            stage={stage.id}
            tick={visualTick}
            videoRef={videoRef}
          />
        </section>

        <ol className="run-steps">
          {stages.map((item, index) => (
            <li
              key={item.id}
              className={
                index < stageIndex ? "done" : index === stageIndex ? "active" : ""
              }
            >
              <span>{index < stageIndex ? "✓" : index + 1}</span>
              {item.name}
            </li>
          ))}
        </ol>
      </main>
    );
  }

  if (!result) return null;
  const verdict = result.ceilingReached
    ? "This computer is above the current test ceiling."
    : result.grade === "A"
      ? "Comfortable for everyday use."
      : result.grade === "B"
        ? "A useful everyday computer with modest limits."
        : result.grade === "C"
          ? "Good for focused, light-duty work."
          : "Best used for one simple purpose at a time.";

  const checks = [
    {
      name: "Everyday work",
      score: result.responsivenessScore,
      detail: `${Math.round(result.p95)} ms slower-moment response`,
    },
    {
      name: "Documents",
      score: Math.round(
        (result.responsivenessScore + result.storageScore) / 2,
      ),
      detail: `${Math.round(result.storageWriteMs)} ms local save`,
    },
    {
      name: "Motion & video",
      score: Math.round(
        (result.smoothnessScore + (result.videoScore ?? result.smoothnessScore)) /
          2,
      ),
      detail:
        result.videoDroppedRatio == null
          ? "Video detail unavailable"
          : `${(result.videoDroppedRatio * 100).toFixed(1)}% video frames dropped`,
    },
    {
      name: "Multitasking",
      score: result.multitaskingScore,
      detail: `${Math.round(result.pressureP95)} ms response under pressure`,
    },
    {
      name: "Recovery",
      score: result.recoveryMs <= 1000 ? 90 : result.recoveryMs <= 3000 ? 65 : 35,
      detail: `${Math.round(result.recoveryMs)} ms to settle`,
    },
  ];

  return (
    <main className="result-page">
      <header className="simple-header">
        <button className="simple-brand brand-button" onClick={() => setPhase("home")}>
          <span>S</span> StillGood
        </button>
        <span className="experimental-label">Fast Check</span>
      </header>

      <section className="clear-answer">
        <div className="answer-grade">{result.grade}</div>
        <div>
          <p className="kicker">
            {result.ceilingReached
              ? "Above test ceiling"
              : `${result.label} · ${result.score}/100`}
          </p>
          <h1>{verdict}</h1>
          <p>
            Comfortable: <strong>{result.comfortableWorkload}</strong>.
            Usable: <strong>{result.usableWorkload}</strong>.
          </p>
        </div>
      </section>

      <section className="check-results">
        {checks.map((check) => (
          <article key={check.name}>
            <div>
              <strong>{check.name}</strong>
              <span>{labelForScore(check.score)}</span>
            </div>
            <div className="result-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(4, check.score)}%` }} />
            </div>
            <p>{check.detail}</p>
          </article>
        ))}
      </section>

      <section className="fit-summary">
        <div>
          <p className="kicker">Good fit for</p>
          <div className="role-pills">
            {result.roles.length
              ? result.roles.map((role) => <span key={role}>{role}</span>)
              : <span>Simple focused tasks</span>}
          </div>
        </div>
        <div className="result-buttons">
          <button className="secondary-action" onClick={() => setPhase("home")}>
            Test again
          </button>
          <button className="primary-action" onClick={downloadResult}>
            Export details
          </button>
        </div>
      </section>

      <details className="result-details">
        <summary>Technical details</summary>
        <p>{result.browser} · {result.platform}</p>
        <p>
          {result.samples.length} timed foreground samples ·
          {" "}{(result.elapsedMs / 1000).toFixed(1)} seconds total ·
          {" "}{result.longTaskCount} long tasks
        </p>
        <p>
          This result measures browser-observed behavior. It does not diagnose
          CPU, RAM, temperature, battery health, or the physical drive.
        </p>
      </details>
    </main>
  );
}

function labelForScore(score: number) {
  if (score >= 85) return "Comfortable";
  if (score >= 65) return "Usable";
  if (score >= 40) return "Limited";
  return "Struggling";
}

function BenchmarkVisual({
  stage,
  tick,
  videoRef,
}: {
  stage: StageId;
  tick: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  if (stage === "media") {
    return (
      <div className="test-visual media-visual">
        <video
          ref={videoRef}
          src="/benchmark-assets/flower.mp4"
          muted
          playsInline
          preload="auto"
        />
        <div className="motion-dots">
          {Array.from({ length: 8 }, (_, index) => (
            <i
              key={index}
              style={{
                transform: `translateX(${((tick + index) % 8) * 9}px)`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (stage === "storage") {
    return (
      <div className="test-visual storage-visual">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className={index <= tick % 6 ? "filled" : ""}>
            <i />
          </span>
        ))}
      </div>
    );
  }

  if (stage === "multitasking") {
    return (
      <div className="test-visual multitask-visual">
        {["Inbox", "Document", "Search", "Background"].map((label, index) => (
          <article key={label} className={index === tick % 4 ? "active" : ""}>
            <strong>{label}</strong>
            <i style={{ width: `${48 + ((tick + index) * 9) % 42}%` }} />
            <i style={{ width: `${35 + ((tick + index) * 13) % 50}%` }} />
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={`test-visual ${stage === "documents" ? "document-visual" : "inbox-visual"}`}>
      <div className="visual-toolbar">
        <span>{stage === "documents" ? "Community device log" : "Practice inbox"}</span>
        <i />
      </div>
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className={index === tick % 7 ? "active" : ""}>
          <i />
          <strong>{stage === "documents" ? `Device row ${index + 1}` : ["Repair fair", "Laptop pickup", "Battery notes"][index % 3]}</strong>
          <span />
        </div>
      ))}
    </div>
  );
}
