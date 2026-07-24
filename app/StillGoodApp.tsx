"use client";

import { useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  median,
  summarizeThoroughRun,
} from "@/lib/scoring.mjs";

type Phase = "home" | "prepare" | "run" | "result";
type StageId =
  | "everyday"
  | "documents"
  | "graphics"
  | "video"
  | "multitasking"
  | "storage";
type PowerMode = "battery" | "plugged-in" | "not-sure";
type Tier = { id: string; label: string; size: number; domRows: number };
type TimedSample = {
  durationMs: number;
  workMs: number;
  presentationMs: number;
  checksum: number;
};
type LatencyTierResult = {
  id: string;
  label: string;
  samples: TimedSample[];
};
type GraphicsTierResult = {
  id: string;
  label: string;
  complexity: number;
  onTimeRatio: number;
  longFrameRatio: number;
  worstFrameMs: number;
  frameCount: number;
};
type VideoTierResult = {
  id: string;
  label: string;
  width: number;
  height: number;
  droppedRatio: number;
  stalls: number;
  completed: boolean;
  totalFrames: number;
};
type StorageTierResult = {
  id: string;
  label: string;
  sizeMB: number;
  writeMs: number;
  readMs: number;
};
type TierSummary = {
  id: string;
  label: string;
  medianMs: number;
  worstMs: number;
  cv: number;
  status: string;
};
type LatencyCategory = {
  score: number;
  highestComfortable: string;
  highestUsable: string;
  tiers: TierSummary[];
};
type SimpleCategory = {
  score: number;
  highestComfortable?: string;
  highestUsable?: string;
  tiers: Array<{ id: string; label: string; status: string }>;
};
type ThoroughResult = {
  grade: string;
  label: string;
  score: number;
  ceilingReached: boolean;
  confidence: string;
  everyday: LatencyCategory;
  documents: LatencyCategory;
  multitasking: LatencyCategory;
  graphics: SimpleCategory;
  video: SimpleCategory;
  storage: SimpleCategory;
  recoveryMs: number;
  longTaskCount: number;
  longAnimationFrameCount: number;
  roles: string[];
  browser: string;
  platform: string;
  powerMode: PowerMode;
  logicalProcessors: number | null;
  cadenceMs: number;
  startedAt: string;
  elapsedMs: number;
  profileVersion: string;
  raw: unknown;
};

const stages: Array<{
  id: StageId;
  name: string;
  title: string;
  detail: string;
}> = [
  {
    id: "everyday",
    name: "Everyday apps",
    title: "Everyday browser work",
    detail: "Five levels of searching, sorting, filtering, and rendering.",
  },
  {
    id: "documents",
    name: "Documents",
    title: "Documents and tables",
    detail: "Editing, text search, table sorting, and increasingly large views.",
  },
  {
    id: "graphics",
    name: "Visuals",
    title: "Visual smoothness",
    detail: "Four increasing canvas workloads measured against this display.",
  },
  {
    id: "video",
    name: "Video",
    title: "Real video playback",
    detail: "Local H.264 clips at 480p, 720p, and 1080p.",
  },
  {
    id: "multitasking",
    name: "Multitasking",
    title: "Responsiveness under pressure",
    detail: "Foreground work while one or more background workers stay busy.",
  },
  {
    id: "storage",
    name: "Storage",
    title: "Browser storage and recovery",
    detail: "Local datasets from 1 MB to 32 MB, followed by recovery checks.",
  },
];

const workloadTiers: Tier[] = [
  { id: "basic", label: "Basic", size: 1200, domRows: 30 },
  { id: "everyday", label: "Everyday", size: 4500, domRows: 90 },
  { id: "busy", label: "Busy", size: 14000, domRows: 220 },
  { id: "demanding", label: "Demanding", size: 38000, domRows: 480 },
  { id: "extreme", label: "Extreme", size: 85000, domRows: 900 },
];

const videoTiers = [
  {
    id: "480p",
    label: "480p",
    width: 854,
    height: 480,
    src: "/benchmark-assets/video-480p.mp4",
    durationMs: 3200,
  },
  {
    id: "720p",
    label: "720p",
    width: 1280,
    height: 720,
    src: "/benchmark-assets/video-720p.mp4",
    durationMs: 4200,
  },
  {
    id: "1080p",
    label: "1080p",
    width: 1920,
    height: 1080,
    src: "/benchmark-assets/video-1080p.mp4",
    durationMs: 4200,
  },
];

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const nextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

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

function deterministicJourney(seed: number, size: number, documentMode: boolean) {
  let value = seed >>> 0;
  const rows = Array.from({ length: size }, (_, index) => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return {
      id: index,
      score: value % 1000003,
      text: `${documentMode ? "battery inspection" : "repair fair"} ${value.toString(36)} device record`,
    };
  });
  rows.sort((a, b) => a.score - b.score || a.id - b.id);
  const query = documentMode ? "battery" : "repair";
  const filtered = rows.filter(
    (row) => row.score % 5 < 2 && row.text.includes(query),
  );
  const json = JSON.stringify(filtered.slice(0, Math.min(1800, filtered.length)));
  const restored = JSON.parse(json) as Array<{ score: number }>;
  return restored.reduce((checksum, row) => (checksum ^ row.score) >>> 0, 0);
}

function classifyScore(score: number) {
  if (score >= 92) return "Excellent";
  if (score >= 84) return "Comfortable";
  if (score >= 68) return "Useful";
  if (score >= 48) return "Limited";
  return "Struggling";
}

async function openStorageDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("stillgood-thorough-check", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("blocks"))
        request.result.createObjectStore("blocks");
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function runStorageTier(
  database: IDBDatabase,
  sizeMB: number,
  tierIndex: number,
): Promise<StorageTierResult> {
  const block = new Uint8Array(256 * 1024);
  for (let index = 0; index < block.length; index += 4096)
    block[index] = (index + tierIndex) % 251;
  const blockCount = sizeMB * 4;

  const writeMs = await new Promise<number>((resolve, reject) => {
    const start = performance.now();
    const transaction = database.transaction("blocks", "readwrite");
    const store = transaction.objectStore("blocks");
    store.clear();
    for (let index = 0; index < blockCount; index += 1)
      store.put(block, `${tierIndex}-${index}`);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve(performance.now() - start);
  });

  const readMs = await new Promise<number>((resolve, reject) => {
    const start = performance.now();
    const transaction = database.transaction("blocks", "readonly");
    const store = transaction.objectStore("blocks");
    for (let index = 0; index < blockCount; index += 1)
      store.get(`${tierIndex}-${index}`);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve(performance.now() - start);
  });

  return {
    id: `${sizeMB}mb`,
    label: `${sizeMB} MB`,
    sizeMB,
    writeMs,
    readMs,
  };
}

export function StillGoodApp() {
  const [phase, setPhase] = useState<Phase>("home");
  const [powerMode, setPowerMode] = useState<PowerMode>("not-sure");
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [visualTick, setVisualTick] = useState(0);
  const [visualRows, setVisualRows] = useState(30);
  const [result, setResult] = useState<ThoroughResult | null>(null);
  const [notice, setNotice] = useState("");
  const cancelledRef = useRef(false);
  const workersRef = useRef<Worker[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    setNotice("Test stopped safely. Temporary data was removed.");
    indexedDB.deleteDatabase("stillgood-thorough-check");
  }

  async function measureJourney(
    stageId: "everyday" | "documents" | "multitasking",
    tier: Tier,
    seed: number,
  ): Promise<TimedSample> {
    const start = performance.now();
    const workStart = performance.now();
    const checksum = deterministicJourney(
      seed,
      tier.size,
      stageId === "documents",
    );
    const workMs = performance.now() - workStart;
    setVisualRows(tier.domRows);
    setVisualTick((value) => value + 1);
    await nextPaint();
    const durationMs = performance.now() - start;
    return {
      durationMs,
      workMs,
      presentationMs: durationMs - workMs,
      checksum,
    };
  }

  async function runLatencySection(
    stageId: "everyday" | "documents",
    progressStart: number,
    progressEnd: number,
  ) {
    const output: LatencyTierResult[] = [];
    for (let tierIndex = 0; tierIndex < workloadTiers.length; tierIndex += 1) {
      const tier = workloadTiers[tierIndex];
      if (cancelledRef.current) break;
      setStatus(`${tier.label} workload · warm-up`);
      await measureJourney(stageId, tier, 1000 + tierIndex * 100);
      const samples: TimedSample[] = [];
      setStatus(`${tier.label} workload · 3 measured runs`);
      for (let repetition = 0; repetition < 3; repetition += 1) {
        samples.push(
          await measureJourney(
            stageId,
            tier,
            1100 + tierIndex * 100 + repetition,
          ),
        );
        setProgress(
          progressStart +
            ((tierIndex * 3 + repetition + 1) / 15) *
              (progressEnd - progressStart),
        );
        await sleep(90);
      }
      output.push({ id: tier.id, label: tier.label, samples });
      if (
        median(samples.map((sample) => sample.durationMs)) > 2500 ||
        Math.max(...samples.map((sample) => sample.durationMs)) > 5000
      ) {
        for (
          let remaining = tierIndex + 1;
          remaining < workloadTiers.length;
          remaining += 1
        ) {
          const skipped = workloadTiers[remaining];
          output.push({
            id: skipped.id,
            label: skipped.label,
            samples: [
              {
                durationMs: 6000,
                workMs: 6000,
                presentationMs: 0,
                checksum: 0,
              },
            ],
          });
        }
        break;
      }
    }
    return output;
  }

  async function runGraphicsTier(
    id: string,
    label: string,
    complexity: number,
    cadenceMs: number,
  ): Promise<GraphicsTierResult> {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) {
      return {
        id,
        label,
        complexity,
        onTimeRatio: 0,
        longFrameRatio: 1,
        worstFrameMs: 999,
        frameCount: 0,
      };
    }

    const intervals: number[] = [];
    let previous = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const draw = (timestamp: number) => {
        if (previous) intervals.push(timestamp - previous);
        previous = timestamp;
        context.fillStyle = "#172019";
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < complexity; index += 1) {
          const x = (index * 47 + timestamp * 0.08) % canvas.width;
          const y = (index * 83 + timestamp * 0.04) % canvas.height;
          context.fillStyle =
            index % 3 === 0 ? "#c9ed61" : index % 3 === 1 ? "#8fb5a0" : "#f2d5bf";
          context.beginPath();
          context.arc(x, y, 2 + (index % 7), 0, Math.PI * 2);
          context.fill();
        }
        if (
          performance.now() - start < 1800 &&
          !cancelledRef.current
        ) {
          requestAnimationFrame(draw);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(draw);
    });
    const late = intervals.filter((value) => value > cadenceMs * 1.5).length;
    const long = intervals.filter((value) => value > 50).length;
    return {
      id,
      label,
      complexity,
      onTimeRatio: intervals.length ? 1 - late / intervals.length : 0,
      longFrameRatio: intervals.length ? long / intervals.length : 1,
      worstFrameMs: Math.max(...intervals, 0),
      frameCount: intervals.length,
    };
  }

  async function runVideoTier(
    tier: (typeof videoTiers)[number],
  ): Promise<VideoTierResult> {
    const video = videoRef.current;
    if (!video)
      return {
        ...tier,
        droppedRatio: 1,
        stalls: 1,
        completed: false,
        totalFrames: 0,
      };

    video.pause();
    video.src = tier.src;
    video.load();
    const loaded = await Promise.race([
      new Promise<boolean>((resolve) => {
        video.addEventListener("loadeddata", () => resolve(true), {
          once: true,
        });
        video.addEventListener("error", () => resolve(false), { once: true });
      }),
      sleep(8000).then(() => false),
    ]);
    if (!loaded)
      return {
        ...tier,
        droppedRatio: 1,
        stalls: 1,
        completed: false,
        totalFrames: 0,
      };

    let stalls = 0;
    const onWaiting = () => {
      stalls += 1;
    };
    video.addEventListener("waiting", onWaiting);
    const before = video.getVideoPlaybackQuality?.();
    let completed = false;
    try {
      video.currentTime = 0;
      video.muted = true;
      await video.play();
      await sleep(tier.durationMs);
      completed = !video.paused && video.readyState >= 2;
    } catch {
      completed = false;
    }
    video.pause();
    video.removeEventListener("waiting", onWaiting);
    const after = video.getVideoPlaybackQuality?.();
    const totalFrames =
      before && after ? after.totalVideoFrames - before.totalVideoFrames : 0;
    const dropped =
      before && after ? after.droppedVideoFrames - before.droppedVideoFrames : 0;
    return {
      id: tier.id,
      label: tier.label,
      width: tier.width,
      height: tier.height,
      droppedRatio: totalFrames > 0 ? dropped / totalFrames : completed ? 0 : 1,
      stalls,
      completed,
      totalFrames,
    };
  }

  async function begin() {
    cancelledRef.current = false;
    setNotice("");
    setResult(null);
    setProgress(0);
    setStageIndex(0);
    setPhase("prepare");
    setStatus("Caching the local workloads");
    const startedAt = new Date().toISOString();
    const testStart = performance.now();

    await Promise.allSettled(
      videoTiers.map((tier) =>
        fetch(tier.src, { cache: "force-cache" }).then((response) => {
          if (!response.ok) throw new Error(`Missing ${tier.label} video`);
          return response.arrayBuffer();
        }),
      ),
    );

    setStatus("Calibrating this display and warming up");
    const cadenceSamples: number[] = [];
    let previous = 0;
    const cadenceStart = performance.now();
    await new Promise<void>((resolve) => {
      const collect = (timestamp: number) => {
        if (previous) cadenceSamples.push(timestamp - previous);
        previous = timestamp;
        if (performance.now() - cadenceStart < 1100)
          requestAnimationFrame(collect);
        else resolve();
      };
      requestAnimationFrame(collect);
    });
    const cadenceMs = median(cadenceSamples.slice(5)) || 16.67;

    const longTasks: number[] = [];
    const longFrames: number[] = [];
    const observers: PerformanceObserver[] = [];
    for (const entryType of ["longtask", "long-animation-frame"]) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            (entryType === "longtask" ? longTasks : longFrames).push(
              entry.duration,
            );
          });
        });
        observer.observe({ type: entryType, buffered: false });
        observers.push(observer);
      } catch {
        // Unsupported collectors lower detail, never invent measurements.
      }
    }

    let interruptionCount = 0;
    const onVisibility = () => {
      if (document.hidden) interruptionCount += 1;
    };
    document.addEventListener("visibilitychange", onVisibility);
    setPhase("run");

    try {
      setStageIndex(0);
      await nextPaint();
      const everydayTiers = await runLatencySection("everyday", 2, 25);
      if (cancelledRef.current) return;

      setStageIndex(1);
      await nextPaint();
      const documentTiers = await runLatencySection("documents", 25, 47);
      if (cancelledRef.current) return;

      setStageIndex(2);
      setStatus("Ramping from light motion to a dense canvas");
      await nextPaint();
      const graphicsTiers: GraphicsTierResult[] = [];
      const graphicsLevels = [
        ["light", "Light", 80],
        ["medium", "Medium", 260],
        ["busy", "Busy", 700],
        ["dense", "Dense", 1500],
      ] as const;
      for (let index = 0; index < graphicsLevels.length; index += 1) {
        const [id, label, complexity] = graphicsLevels[index];
        graphicsTiers.push(
          await runGraphicsTier(id, label, complexity, cadenceMs),
        );
        setProgress(47 + ((index + 1) / graphicsLevels.length) * 13);
      }
      if (cancelledRef.current) return;

      setStageIndex(3);
      await nextPaint();
      const measuredVideoTiers: VideoTierResult[] = [];
      for (let index = 0; index < videoTiers.length; index += 1) {
        setStatus(`Playing ${videoTiers[index].label} H.264 video`);
        const measured = await runVideoTier(videoTiers[index]);
        measuredVideoTiers.push(measured);
        setProgress(60 + ((index + 1) / videoTiers.length) * 13);
        if (
          !measured.completed ||
          measured.droppedRatio > 0.15 ||
          measured.stalls > 2
        ) {
          for (
            let remaining = index + 1;
            remaining < videoTiers.length;
            remaining += 1
          ) {
            measuredVideoTiers.push({
              ...videoTiers[remaining],
              droppedRatio: 1,
              stalls: 1,
              completed: false,
              totalFrames: 0,
            });
          }
          break;
        }
      }
      if (cancelledRef.current) return;

      setStageIndex(4);
      await nextPaint();
      const multitaskTiers: LatencyTierResult[] = [];
      const maxWorkers = Math.max(
        1,
        Math.min(4, (navigator.hardwareConcurrency || 2) - 1),
      );
      for (let level = 0; level < 4; level += 1) {
        const tier = workloadTiers[level + 1];
        const workerCount = Math.min(maxWorkers, level + 1);
        setStatus(
          `${tier.label} foreground work · ${workerCount} background worker${workerCount === 1 ? "" : "s"}`,
        );
        workersRef.current = Array.from({ length: workerCount }, (_, index) => {
          const worker = new Worker("/benchmark-worker.js");
          worker.postMessage({
            type: "start",
            seed: 500 + level * 20 + index,
            workUnits: 4 + level * 5,
            durationMs: 12000,
          });
          return worker;
        });
        await sleep(350);
        await measureJourney("multitasking", tier, 3000 + level * 100);
        const samples: TimedSample[] = [];
        const repetitions = level === 3 ? 8 : 3;
        for (let repetition = 0; repetition < repetitions; repetition += 1) {
          samples.push(
            await measureJourney(
              "multitasking",
              tier,
              3100 + level * 100 + repetition,
            ),
          );
          await sleep(level === 3 ? 350 : 140);
        }
        multitaskTiers.push({ id: tier.id, label: tier.label, samples });
        workersRef.current.forEach((worker) => {
          worker.postMessage({ type: "cancel" });
          worker.terminate();
        });
        workersRef.current = [];
        setProgress(73 + ((level + 1) / 4) * 16);
        if (median(samples.map((sample) => sample.durationMs)) > 3000) {
          for (let remaining = level + 1; remaining < 4; remaining += 1) {
            const skipped = workloadTiers[remaining + 1];
            multitaskTiers.push({
              id: skipped.id,
              label: skipped.label,
              samples: [
                {
                  durationMs: 6000,
                  workMs: 6000,
                  presentationMs: 0,
                  checksum: 0,
                },
              ],
            });
          }
          break;
        }
      }
      if (cancelledRef.current) return;

      setStageIndex(5);
      await nextPaint();
      const storageTiers: StorageTierResult[] = [];
      let database: IDBDatabase | null = null;
      try {
        database = await openStorageDatabase();
        for (const [index, size] of [1, 8, 32].entries()) {
          setStatus(`Writing and reading a temporary ${size} MB dataset`);
          setVisualRows(size * 8);
          storageTiers.push(await runStorageTier(database, size, index));
          setProgress(89 + ((index + 1) / 3) * 8);
        }
      } catch {
        storageTiers.push(
          { id: "1mb", label: "1 MB", sizeMB: 1, writeMs: 2000, readMs: 2000 },
          { id: "8mb", label: "8 MB", sizeMB: 8, writeMs: 6000, readMs: 6000 },
          {
            id: "32mb",
            label: "32 MB",
            sizeMB: 32,
            writeMs: 12000,
            readMs: 12000,
          },
        );
      } finally {
        database?.close();
        indexedDB.deleteDatabase("stillgood-thorough-check");
      }

      setStatus("Measuring recovery and run stability");
      const recoveryStart = performance.now();
      let stable = 0;
      while (stable < 5 && performance.now() - recoveryStart < 12000) {
        const probe = performance.now();
        await sleep(50);
        const lag = performance.now() - probe - 50;
        stable = lag < 20 ? stable + 1 : 0;
      }
      const recoveryMs = performance.now() - recoveryStart;
      const summary = summarizeThoroughRun({
        everydayTiers,
        documentTiers,
        graphicsTiers,
        videoTiers: measuredVideoTiers,
        multitaskTiers,
        storageTiers,
        recoveryMs,
        longTaskCount: longTasks.length,
        longAnimationFrameCount: longFrames.length,
        interruptionCount,
      });

      setResult({
        ...summary,
        browser: browserLabel(),
        platform: navigator.platform || "Platform not reported",
        powerMode,
        logicalProcessors: navigator.hardwareConcurrency || null,
        cadenceMs,
        startedAt,
        elapsedMs: performance.now() - testStart,
        profileVersion: "2.0.0-experimental-thorough",
        raw: {
          everydayTiers,
          documentTiers,
          graphicsTiers,
          videoTiers: measuredVideoTiers,
          multitaskTiers,
          storageTiers,
        },
      });
      setProgress(100);
      setPhase("result");
    } finally {
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      observers.forEach((observer) => observer.disconnect());
      document.removeEventListener("visibilitychange", onVisibility);
    }
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schemaVersion: "stillgood-result.v2",
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
    link.download = `stillgood-thorough-check-${Date.now()}.json`;
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
          <span className="experimental-label">Method v2</span>
        </header>
        {notice && (
          <p className="simple-notice" role="status">
            {notice}
          </p>
        )}
        <section className="simple-hero">
          <p className="kicker">A practical benchmark for older computers</p>
          <h1>What is this computer still good for?</h1>
          <p className="simple-lede">
            A thorough automatic test of everyday apps, documents, graphics,
            video, multitasking, and browser storage. Usually about one minute.
          </p>
          <div className="power-choice" aria-label="Current power mode">
            <span>Running:</span>
            {(
              [
                ["battery", "On battery"],
                ["plugged-in", "Plugged in"],
                ["not-sure", "Not sure"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={powerMode === value ? "selected" : ""}
                onClick={() => setPowerMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="start-button" onClick={begin}>
            Start thorough test <span aria-hidden="true">→</span>
          </button>
          <p className="quiet-instruction">
            Keep this tab visible and leave the computer alone until it finishes.
          </p>
        </section>
        <section className="five-checks six-checks" aria-label="The six checks">
          {stages.map((item, index) => (
            <article key={item.id}>
              <span>{index + 1}</span>
              <strong>{item.name}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>
        <section className="plain-boundary">
          <strong>More evidence</strong>
          <p>
            Five workload levels, separate warm-ups, three measured repetitions,
            variability checks, and real 480p–1080p video.
          </p>
          <strong>Clear limits</strong>
          <p>
            The browser cannot diagnose battery health, temperature, system RAM,
            or every desktop application.
          </p>
        </section>
        <footer className="simple-footer">
          <span>No account · deterministic local workloads · exportable evidence</span>
          <span>Results describe this computer and browser together.</span>
        </footer>
      </main>
    );
  }

  if (phase === "prepare") {
    return (
      <main className="run-shell">
        <header className="run-header">
          <span className="simple-brand">
            <i>S</i> StillGood
          </span>
          <button onClick={stop}>Stop</button>
        </header>
        <section className="prepare-view">
          <div className="pulse-mark" aria-hidden="true" />
          <p className="kicker">Preparing unscored assets</p>
          <h1>{status}</h1>
          <p>Downloads, decoding preparation, and warm-up are excluded.</p>
        </section>
      </main>
    );
  }

  if (phase === "run") {
    return (
      <main className="run-shell">
        <header className="run-header">
          <span className="simple-brand">
            <i>S</i> StillGood
          </span>
          <span>{Math.round(progress)}%</span>
          <button onClick={stop}>Stop</button>
        </header>
        <div className="thin-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <section className="run-main">
          <div
            className="progress-orbit"
            style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}
            aria-label={`${Math.round(progress)} percent complete`}
          >
            <strong>{stageIndex + 1}</strong>
            <span>of 6</span>
          </div>
          <div className="run-message">
            <p className="kicker">{stage.name}</p>
            <h1>{stage.title}</h1>
            <p>{stage.detail}</p>
            <div className="current-status">
              <i /> {status}
            </div>
          </div>
          <BenchmarkVisual
            stage={stage.id}
            tick={visualTick}
            rows={visualRows}
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
        </section>
        <ol className="run-steps">
          {stages.map((item, index) => (
            <li
              key={item.id}
              className={
                index < stageIndex
                  ? "done"
                  : index === stageIndex
                    ? "active"
                    : ""
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
  const categoryCards = [
    ["Everyday apps", result.everyday],
    ["Documents", result.documents],
    ["Multitasking", result.multitasking],
    ["Visual smoothness", result.graphics],
    ["Video", result.video],
    ["Browser storage", result.storage],
  ] as const;
  const detailCategories: Array<[string, LatencyCategory]> = [
    ["Everyday apps", result.everyday],
    ["Documents", result.documents],
    ["Multitasking", result.multitasking],
  ];
  const verdict =
    result.grade === "A+"
      ? "Fast enough to feel modern in this browser."
      : result.grade === "A"
        ? "Comfortable for everyday browser-based computing."
        : result.grade.startsWith("B")
          ? "A genuinely useful second-life computer."
          : result.grade.startsWith("C")
            ? "Useful for focused, lighter work."
            : "Best assigned one simple job at a time.";

  return (
    <main className="result-page">
      <header className="simple-header">
        <button
          className="simple-brand brand-button"
          onClick={() => setPhase("home")}
        >
          <span>S</span> StillGood
        </button>
        <span className="experimental-label">Confidence: {result.confidence}</span>
      </header>
      <section className="clear-answer">
        <div className="answer-grade answer-grade-wide">{result.grade}</div>
        <div>
          <p className="kicker">
            {result.ceilingReached
              ? "Above the current test ceiling"
              : `${result.label} · ${result.score}/100`}
          </p>
          <h1>{verdict}</h1>
          <p>
            Comfortable everyday level:{" "}
            <strong>{result.everyday.highestComfortable}</strong>. Usable under
            multitasking: <strong>{result.multitasking.highestUsable}</strong>.
          </p>
        </div>
      </section>
      <section className="check-results check-results-six">
        {categoryCards.map(([name, category]) => (
          <article key={name}>
            <div>
              <strong>{name}</strong>
              <span>{classifyScore(category.score)} · {category.score}</span>
            </div>
            <div className="result-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(3, category.score)}%` }} />
            </div>
            <p>
              {"highestComfortable" in category
                ? `Comfortable through ${category.highestComfortable}`
                : `${category.tiers.at(-1)?.label ?? "No"} dataset measured`}
            </p>
          </article>
        ))}
      </section>
      <section className="fit-summary">
        <div>
          <p className="kicker">Good fit for</p>
          <div className="role-pills">
            {result.roles.map((role: string) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </div>
        <div className="result-buttons">
          <button className="secondary-action" onClick={() => setPhase("home")}>
            Test again
          </button>
          <button className="primary-action" onClick={downloadResult}>
            Export full result
          </button>
        </div>
      </section>
      <details className="result-details">
        <summary>Workload levels and measurements</summary>
        <div className="tier-detail-grid">
          {detailCategories.map(([name, category]) => (
            <section key={name}>
              <strong>{name}</strong>
              {category.tiers.map((tier) => (
                <p key={tier.id}>
                  {tier.label}: {tier.status} · median{" "}
                  {Math.round(tier.medianMs)} ms · worst{" "}
                  {Math.round(tier.worstMs)} ms · variation{" "}
                  {(tier.cv * 100).toFixed(0)}%
                </p>
              ))}
            </section>
          ))}
        </div>
        <p>
          {result.browser} · {result.platform} · {result.powerMode} ·{" "}
          {result.logicalProcessors ?? "unknown"} logical processors
        </p>
        <p>
          {(result.elapsedMs / 1000).toFixed(1)} seconds ·{" "}
          {result.longTaskCount} long tasks · {result.longAnimationFrameCount}{" "}
          long animation frames · profile {result.profileVersion}
        </p>
        <p>
          This result measures browser-observed behavior. It does not diagnose
          CPU, RAM, thermals, battery health, or physical-drive throughput.
        </p>
      </details>
    </main>
  );
}

function BenchmarkVisual({
  stage,
  tick,
  rows,
  videoRef,
  canvasRef,
}: {
  stage: StageId;
  tick: number;
  rows: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  if (stage === "graphics") {
    return (
      <div className="test-visual media-visual">
        <canvas ref={canvasRef} width={900} height={500} />
      </div>
    );
  }
  if (stage === "video") {
    return (
      <div className="test-visual media-visual">
        <video ref={videoRef} muted playsInline preload="auto" />
        <p className="video-caption">Local test media · network excluded</p>
      </div>
    );
  }
  if (stage === "multitasking") {
    return (
      <div className="test-visual multitask-visual">
        {["Foreground app", "Document", "Search", "Background workers"].map(
          (label, index) => (
            <article key={label} className={index === tick % 4 ? "active" : ""}>
              <strong>{label}</strong>
              <i style={{ width: `${48 + ((tick + index) * 9) % 42}%` }} />
              <i style={{ width: `${35 + ((tick + index) * 13) % 50}%` }} />
            </article>
          ),
        )}
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
  const visibleRows = Math.min(rows, 900);
  return (
    <div
      className={`test-visual data-visual ${
        stage === "documents" ? "document-visual" : "inbox-visual"
      }`}
    >
      <div className="visual-toolbar">
        <span>{stage === "documents" ? "Community device log" : "Practice inbox"}</span>
        <i />
      </div>
      <div className="scrolling-data">
        {Array.from({ length: visibleRows }, (_, index) => (
          <div key={index} className={index === tick % visibleRows ? "active" : ""}>
            <i />
            <strong>
              {stage === "documents"
                ? `Device record ${index + 1}`
                : ["Repair fair", "Laptop pickup", "Battery notes"][index % 3]}
            </strong>
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}
