"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import {
  median,
  qualifiesForHeadroom,
  summarizeThoroughRun,
} from "@/lib/scoring.mjs";
import { classifyFormFactor } from "@/lib/context.mjs";
import { buildCapabilityGuide } from "@/lib/capability-guide.mjs";
import {
  browsingActionNames,
  buildBrowsingDataset,
  createBrowsingView,
} from "@/lib/browsing-workloads.mjs";
import {
  buildEmailDataset,
  buildSpreadsheetDataset,
  buildWritingDataset,
  createEmailView,
  createSpreadsheetView,
  createWritingView,
  emailActionNames,
  spreadsheetActionNames,
  writingActionNames,
} from "@/lib/office-workloads.mjs";

type Phase = "home" | "prepare" | "run" | "result";
type StageId =
  | "browsing"
  | "email"
  | "writing"
  | "spreadsheets"
  | "graphics"
  | "video"
  | "multitasking"
  | "storage";
type Tier = {
  id: string;
  label: string;
  size: number;
  domRows: number;
  headroom?: boolean;
};
type TimedSample = {
  durationMs: number;
  workMs: number;
  presentationMs: number;
  checksum: number;
  actions: Array<{ name: string; durationMs: number; workMs: number }>;
};
type BrowsingView = {
  actionName: string;
  layout: string;
  query: string;
  article: null | {
    id: number;
    category: string;
    title: string;
    summary: string;
    hue: number;
  };
  paragraphs: string[];
  items: Array<{
    id: number;
    category: string;
    title: string;
    summary: string;
    price: number;
    rating: number;
    hue: number;
  }>;
  totalResults: number;
  checksum: number;
  success: boolean;
};
type EmailView = {
  actionName: string;
  query: string;
  folder: string;
  totalMatches: number;
  totalMessages: number;
  rows: Array<{
    id: number;
    sender: string;
    subject: string;
    body: string;
    unread: boolean;
    label: string;
    selected: boolean;
  }>;
  activeMessage: null | {
    id: number;
    sender: string;
    subject: string;
    body: string;
    kind: string;
  };
  thread: Array<{ id: string; sender: string; body: string }>;
  draftBlocks: string[];
  checksum: number;
  success: boolean;
};
type WritingView = {
  actionName: string;
  title: string;
  query: string;
  paragraphs: Array<{
    id: number;
    text: string;
    match: boolean;
    bold: boolean;
    italic: boolean;
    heading: boolean;
  }>;
  tableRows: Array<{
    id: number;
    model: string;
    year: number;
    status: string;
  }>;
  matchCount: number;
  saved: boolean;
  wordCount: number;
  editorWidth: number;
  layoutMode: string;
  checksum: number;
  success: boolean;
};
type SpreadsheetView = {
  actionName: string;
  title: string;
  rows: Array<{ row: number; cells: Array<string | number> }>;
  query: string;
  totalRows: number;
  visibleMatches: number;
  cellCount: number;
  recalculatedCells: number;
  pasteCount: number;
  startRow: number;
  checksum: number;
  success: boolean;
};
type LatencyTierResult = {
  id: string;
  label: string;
  samples: TimedSample[];
  earlyStopped?: boolean;
};
type GraphicsTierResult = {
  id: string;
  label: string;
  complexity: number;
  onTimeRatio: number;
  longFrameRatio: number;
  worstFrameMs: number;
  frameCount: number;
  valid?: boolean;
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
  valid: boolean;
  measurementSource: "playback-quality" | "frame-callback" | "unavailable";
  mediaAdvancedMs: number;
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
  score: number;
  earlyStopped: boolean;
};
type LatencyCategory = {
  score: number;
  available?: boolean;
  invalidTierCount?: number;
  highestComfortable: string;
  highestUsable: string;
  tiers: TierSummary[];
  testedHeadroom?: boolean;
  headroomCeiling?: boolean;
  limitFound?: boolean;
};
type SimpleCategory = {
  score: number;
  available?: boolean;
  invalidTierCount?: number;
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
  browsing: LatencyCategory;
  email: LatencyCategory;
  writing: LatencyCategory;
  spreadsheets: LatencyCategory;
  multitasking: LatencyCategory;
  graphics: SimpleCategory;
  video: SimpleCategory;
  storage: SimpleCategory;
  recoveryMs: number;
  longTaskCount: number;
  longAnimationFrameCount: number;
  roles: string[];
  integrityNotes: string[];
  browser: string;
  platform: string;
  formFactor: "mobile" | "computer" | "unknown";
  powerSource: "not-reported";
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
    id: "browsing",
    name: "Browsing",
    title: "Everyday web browsing",
    detail: "Articles, search results, shopping pages, navigation, and filters.",
  },
  {
    id: "email",
    name: "Email",
    title: "Email and webmail",
    detail: "Searching, opening conversations, sorting, and writing replies.",
  },
  {
    id: "writing",
    name: "Writing",
    title: "Writing and documents",
    detail: "Editing, page layout, formatting, tables, and reopening documents.",
  },
  {
    id: "spreadsheets",
    name: "Spreadsheets",
    title: "Spreadsheet work",
    detail: "Formulas, sorting, filtering, pasting, searching, and scrolling.",
  },
  {
    id: "graphics",
    name: "Visuals",
    title: "Visual smoothness",
    detail: "Checks whether scrolling and movement stay smooth as pages get busier.",
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
    detail: "Checks whether the computer stays responsive when work overlaps.",
  },
  {
    id: "storage",
    name: "Storage",
    title: "Browser storage and recovery",
    detail: "Saves temporary browser data, reopens it, and checks recovery.",
  },
];

const workloadTiers: Tier[] = [
  { id: "basic", label: "Basic", size: 1200, domRows: 30 },
  { id: "everyday", label: "Everyday", size: 4500, domRows: 90 },
  { id: "busy", label: "Busy", size: 14000, domRows: 220 },
  { id: "demanding", label: "Demanding", size: 38000, domRows: 480 },
  { id: "extreme", label: "Extreme", size: 85000, domRows: 900 },
];

const browsingTiers: Tier[] = [
  { id: "basic", label: "Basic", size: 400, domRows: 20 },
  { id: "everyday", label: "Everyday", size: 1800, domRows: 36 },
  { id: "busy", label: "Busy", size: 6500, domRows: 64 },
  { id: "demanding", label: "Demanding", size: 18000, domRows: 92 },
  { id: "extreme", label: "Extreme", size: 45000, domRows: 120 },
  {
    id: "headroom",
    label: "Extended",
    size: 120000,
    domRows: 180,
    headroom: true,
  },
  {
    id: "limit",
    label: "Maximum",
    size: 250000,
    domRows: 260,
    headroom: true,
  },
];

const emailTiers: Tier[] = [
  { id: "basic", label: "1,000 messages", size: 1000, domRows: 30 },
  { id: "everyday", label: "5,000 messages", size: 5000, domRows: 48 },
  { id: "busy", label: "20,000 messages", size: 20000, domRows: 64 },
  { id: "demanding", label: "50,000 messages", size: 50000, domRows: 80 },
  { id: "extreme", label: "100,000 messages", size: 100000, domRows: 96 },
  {
    id: "headroom",
    label: "Extended",
    size: 250000,
    domRows: 140,
    headroom: true,
  },
  {
    id: "limit",
    label: "Maximum",
    size: 500000,
    domRows: 200,
    headroom: true,
  },
];

const writingTiers: Tier[] = [
  { id: "basic", label: "1,500 words", size: 1500, domRows: 24 },
  { id: "everyday", label: "8,000 words", size: 8000, domRows: 96 },
  { id: "busy", label: "25,000 words", size: 25000, domRows: 300 },
  { id: "demanding", label: "60,000 words", size: 60000, domRows: 720 },
  { id: "extreme", label: "100,000 words", size: 100000, domRows: 1200 },
  {
    id: "headroom",
    label: "Extended",
    size: 250000,
    domRows: 2500,
    headroom: true,
  },
  {
    id: "limit",
    label: "Maximum",
    size: 500000,
    domRows: 5000,
    headroom: true,
  },
];

const spreadsheetTiers: Tier[] = [
  { id: "basic", label: "1,000 cells", size: 1000, domRows: 24 },
  { id: "everyday", label: "10,000 cells", size: 10000, domRows: 30 },
  { id: "busy", label: "50,000 cells", size: 50000, domRows: 36 },
  { id: "demanding", label: "150,000 cells", size: 150000, domRows: 42 },
  { id: "extreme", label: "400,000 cells", size: 400000, domRows: 48 },
  {
    id: "headroom",
    label: "Extended",
    size: 1000000,
    domRows: 64,
    headroom: true,
  },
  {
    id: "limit",
    label: "Maximum",
    size: 2000000,
    domRows: 80,
    headroom: true,
  },
];

const videoTiers = [
  {
    id: "480p",
    label: "480p",
    width: 854,
    height: 480,
    src: "/benchmark-assets/video-480p.mp4",
    durationMs: 4500,
  },
  {
    id: "720p",
    label: "720p",
    width: 1280,
    height: 720,
    src: "/benchmark-assets/video-720p.mp4",
    durationMs: 4500,
  },
  {
    id: "1080p",
    label: "1080p",
    width: 1920,
    height: 1080,
    src: "/benchmark-assets/video-1080p.mp4",
    durationMs: 4500,
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

function detectFormFactor(): "mobile" | "computer" | "unknown" {
  const uaData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  return classifyFormFactor({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    mobileHint: uaData?.mobile,
  });
}

async function measureRenderedAction<T>(
  compute: () => T,
  commit: (result: T) => void,
) {
  return new Promise<{
    result: T;
    durationMs: number;
    workMs: number;
  }>((resolve) => {
    requestAnimationFrame(() => {
      const start = performance.now();
      const workStart = performance.now();
      const result = compute();
      const workMs = performance.now() - workStart;
      flushSync(() => commit(result));
      requestAnimationFrame(() => {
        window.setTimeout(
          () =>
            resolve({
              result,
              durationMs: performance.now() - start,
              workMs,
            }),
          0,
        );
      });
    });
  });
}

function friendlyProgressLevel(id: string) {
  return (
    {
      basic: "Starting with light everyday work",
      everyday: "Trying typical everyday work",
      busy: "Adding a busier workload",
      demanding: "Checking heavier work",
      extreme: "Finding the practical limit",
      headroom: "Extending the check to find the limit",
      limit: "Testing the remaining headroom",
    }[id] ?? "Checking everyday work"
  );
}

function categoryOutcome(
  category: {
    score: number;
    available?: boolean;
    invalidTierCount?: number;
    testedHeadroom?: boolean;
    headroomCeiling?: boolean;
    limitFound?: boolean;
  },
) {
  if (category.available === false) return "Could not be checked";
  if (category.invalidTierCount) return "Partly checked";
  if (category.headroomCeiling) return "Limit not reached";
  if (category.limitFound) return "Limit found";
  if (category.testedHeadroom) return "Extended range passed";
  if (category.score >= 84) return "Comfortable";
  if (category.score >= 68) return "Good for everyday use";
  if (category.score >= 58) return "Usable with some limits";
  if (category.score >= 48) return "Best for lighter use";
  return "Likely to feel slow";
}

const categoryDescriptions: Record<string, string> = {
  "Web browsing": "Articles, search results, shopping pages, navigation, and filters.",
  "Email and webmail": "Searching, opening conversations, and writing replies.",
  Documents: "Typing, formatting, tables, and changing page layout.",
  Spreadsheets: "Formulas, sorting, filtering, pasting, and scrolling.",
  "Using several things": "Staying responsive while work overlaps.",
  "Scrolling and visuals": "Keeping movement and animated pages smooth.",
  "Video playback": "Playing common video sizes without interruptions.",
  "Saving browser data": "Saving and reopening information in the browser.",
};

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
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [visualTick, setVisualTick] = useState(0);
  const [browsingView, setBrowsingView] = useState<BrowsingView | null>(null);
  const [emailView, setEmailView] = useState<EmailView | null>(null);
  const [writingView, setWritingView] = useState<WritingView | null>(null);
  const [spreadsheetView, setSpreadsheetView] =
    useState<SpreadsheetView | null>(null);
  const [result, setResult] = useState<ThoroughResult | null>(null);
  const [notice, setNotice] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const cancelledRef = useRef(false);
  const workersRef = useRef<Worker[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showGuide) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowGuide(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showGuide]);
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
    stageId:
      | "browsing"
      | "email"
      | "writing"
      | "spreadsheets"
      | "multitasking",
    tier: Tier,
    seed: number,
    dataset: unknown,
  ): Promise<TimedSample> {
    const actionNames =
      stageId === "browsing"
        ? browsingActionNames
        : stageId === "writing"
        ? writingActionNames
        : stageId === "spreadsheets"
          ? spreadsheetActionNames
          : emailActionNames;
    const actions: Array<{ name: string; durationMs: number; workMs: number }> =
      [];
    let durationMs = 0;
    let workMs = 0;
    let checksum = 0;

    for (let actionIndex = 0; actionIndex < actionNames.length; actionIndex += 1) {
      const measured =
        stageId === "browsing"
          ? await measureRenderedAction(
              () =>
                createBrowsingView(
                  dataset,
                  actionIndex,
                  tier.domRows,
                  seed + actionIndex,
                ) as BrowsingView,
              (view) => setBrowsingView(view),
            )
        : stageId === "writing"
        ? await measureRenderedAction(
            () =>
              createWritingView(
                dataset,
                actionIndex,
                tier.domRows,
                seed + actionIndex,
              ) as WritingView,
            (view) => setWritingView(view),
          )
        : stageId === "spreadsheets"
          ? await measureRenderedAction(
              () =>
                createSpreadsheetView(
                  dataset,
                  actionIndex,
                  tier.domRows,
                  seed + actionIndex,
                ) as SpreadsheetView,
              (view) => setSpreadsheetView(view),
            )
          : await measureRenderedAction(
            () =>
              createEmailView(
                dataset,
                actionIndex,
                tier.domRows,
                seed + actionIndex,
              ) as EmailView,
            (view) => setEmailView(view),
          );
      if (!measured.result.success)
        throw new Error(`${actionNames[actionIndex]} fixture assertion failed`);
      durationMs += measured.durationMs;
      workMs += measured.workMs;
      checksum = (checksum ^ measured.result.checksum) >>> 0;
      actions.push({
        name: actionNames[actionIndex],
        durationMs: measured.durationMs,
        workMs: measured.workMs,
      });
      setVisualTick((value) => value + 1);
    }
    return {
      durationMs,
      workMs,
      presentationMs: durationMs - workMs,
      checksum,
      actions,
    };
  }

  async function runLatencySection(
    stageId: "browsing" | "email" | "writing" | "spreadsheets",
    tiers: Tier[],
    progressStart: number,
    progressEnd: number,
  ) {
    const output: LatencyTierResult[] = [];
    const totalPlannedRuns = tiers.reduce(
      (total, tier) => total + (tier.headroom ? 3 : 5),
      0,
    );
    let completedRuns = 0;
    for (let tierIndex = 0; tierIndex < tiers.length; tierIndex += 1) {
      const tier = tiers[tierIndex];
      if (cancelledRef.current) break;
      if (tier.headroom) {
        const previousTier = output.at(-1);
        const headroomLevel = tiers
          .slice(0, tierIndex)
          .filter((candidate) => candidate.headroom).length;
        if (
          !previousTier ||
          !qualifiesForHeadroom(previousTier.samples, headroomLevel)
        ) {
          break;
        }
      }
      const repetitions = tier.headroom ? 3 : 5;
      const dataset =
        stageId === "browsing"
          ? buildBrowsingDataset(700 + tierIndex, tier.size)
          : stageId === "writing"
          ? buildWritingDataset(700 + tierIndex, tier.size)
          : stageId === "spreadsheets"
            ? buildSpreadsheetDataset(700 + tierIndex, tier.size)
            : buildEmailDataset(700 + tierIndex, tier.size);
      setStatus(`${friendlyProgressLevel(tier.id)} · getting ready`);
      await measureJourney(stageId, tier, 1000 + tierIndex * 100, dataset);
      if (tierIndex === 0) {
        await sleep(90);
        await measureJourney(
          stageId,
          tier,
          1050 + tierIndex * 100,
          dataset,
        );
      }
      const samples: TimedSample[] = [];
      setStatus(`${friendlyProgressLevel(tier.id)} · measuring consistency`);
      for (let repetition = 0; repetition < repetitions; repetition += 1) {
        const sample = await measureJourney(
          stageId,
          tier,
          1100 + tierIndex * 100 + repetition,
          dataset,
        );
        samples.push(sample);
        completedRuns += 1;
        setProgress(
          progressStart +
            (completedRuns / totalPlannedRuns) *
              (progressEnd - progressStart),
        );
        if (sample.durationMs > 5000) break;
        await sleep(90);
      }
      output.push({ id: tier.id, label: tier.label, samples });
      if (
        median(samples.map((sample) => sample.durationMs)) > 2500 ||
        Math.max(...samples.map((sample) => sample.durationMs)) > 5000
      ) {
        for (
          let remaining = tierIndex + 1;
          remaining < tiers.length;
          remaining += 1
        ) {
          const skipped = tiers[remaining];
          if (skipped.headroom) continue;
          output.push({
            id: skipped.id,
            label: skipped.label,
            earlyStopped: true,
            samples: [
              {
                durationMs: 6000,
                workMs: 6000,
                presentationMs: 0,
                checksum: 0,
                actions: [],
              },
            ],
          });
        }
        break;
      }
    }
    setProgress(progressEnd);
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
        valid: false,
      };
    }

    const intervals: number[] = [];
    let previous = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const draw = (timestamp: number) => {
        if (previous) intervals.push(timestamp - previous);
        previous = timestamp;
        context.fillStyle = "#162033";
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < complexity; index += 1) {
          const x = (index * 47 + timestamp * 0.08) % canvas.width;
          const y = (index * 83 + timestamp * 0.04) % canvas.height;
          context.fillStyle =
            index % 3 === 0 ? "#6636b8" : index % 3 === 1 ? "#9a7bd2" : "#c8b9e4";
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
      valid: true,
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
        valid: false,
        measurementSource: "unavailable",
        mediaAdvancedMs: 0,
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
        valid: false,
        measurementSource: "unavailable",
        mediaAdvancedMs: 0,
      };

    let stalls = 0;
    let playbackStarted = false;
    const onWaiting = () => {
      if (playbackStarted) stalls += 1;
    };
    const onPlaying = () => {
      playbackStarted = true;
    };
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    const before = video.getVideoPlaybackQuality?.();
    let callbackFrames = 0;
    let frameCallbackId: number | null = null;
    const countFrame = () => {
      callbackFrames += 1;
      frameCallbackId = video.requestVideoFrameCallback(countFrame);
    };
    if (typeof video.requestVideoFrameCallback === "function")
      frameCallbackId = video.requestVideoFrameCallback(countFrame);
    let completed = false;
    let mediaAdvancedMs = 0;
    try {
      video.currentTime = 0;
      video.muted = true;
      await video.play();
      const mediaStart = video.currentTime;
      await sleep(tier.durationMs);
      mediaAdvancedMs = Math.max(0, (video.currentTime - mediaStart) * 1000);
      const availableMediaMs = Number.isFinite(video.duration)
        ? Math.max(250, Math.min(tier.durationMs, video.duration * 1000 - 100))
        : tier.durationMs;
      completed =
        video.readyState >= 2 && mediaAdvancedMs >= availableMediaMs * 0.75;
    } catch {
      completed = false;
    }
    video.pause();
    video.removeEventListener("waiting", onWaiting);
    video.removeEventListener("playing", onPlaying);
    if (
      frameCallbackId != null &&
      typeof video.cancelVideoFrameCallback === "function"
    )
      video.cancelVideoFrameCallback(frameCallbackId);
    const after = video.getVideoPlaybackQuality?.();
    const qualityFrames =
      before && after ? after.totalVideoFrames - before.totalVideoFrames : 0;
    const dropped =
      before && after ? after.droppedVideoFrames - before.droppedVideoFrames : 0;
    const totalFrames = qualityFrames > 0 ? qualityFrames : callbackFrames;
    const measurementSource =
      qualityFrames > 0
        ? "playback-quality"
        : callbackFrames > 0
          ? "frame-callback"
          : "unavailable";
    const minimumObservedFrames = Math.max(
      12,
      Math.floor((mediaAdvancedMs / 1000) * 8),
    );
    const valid = completed && totalFrames >= minimumObservedFrames;
    return {
      id: tier.id,
      label: tier.label,
      width: tier.width,
      height: tier.height,
      droppedRatio:
        qualityFrames > 0
          ? dropped / qualityFrames
          : callbackFrames > 0
            ? 0
            : 1,
      stalls,
      completed,
      totalFrames,
      valid,
      measurementSource,
      mediaAdvancedMs,
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
      const browsingResults = await runLatencySection(
        "browsing",
        browsingTiers,
        2,
        16,
      );
      if (cancelledRef.current) return;

      setStageIndex(1);
      await nextPaint();
      const emailResults = await runLatencySection("email", emailTiers, 16, 28);
      if (cancelledRef.current) return;

      setStageIndex(2);
      await nextPaint();
      const writingResults = await runLatencySection(
        "writing",
        writingTiers,
        28,
        40,
      );
      if (cancelledRef.current) return;

      setStageIndex(3);
      await nextPaint();
      const spreadsheetResults = await runLatencySection(
        "spreadsheets",
        spreadsheetTiers,
        40,
        52,
      );
      if (cancelledRef.current) return;

      setStageIndex(4);
      setStatus("Ramping from light motion to a dense canvas");
      await nextPaint();
      const graphicsTiers: GraphicsTierResult[] = [];
      const graphicsLevels = [
        ["light", "Light", 240],
        ["medium", "Medium", 1200],
        ["busy", "Busy", 4200],
        ["dense", "Dense", 12000],
      ] as const;
      for (let index = 0; index < graphicsLevels.length; index += 1) {
        const [id, label, complexity] = graphicsLevels[index];
        graphicsTiers.push(
          await runGraphicsTier(id, label, complexity, cadenceMs),
        );
        setProgress(52 + ((index + 1) / graphicsLevels.length) * 10);
      }
      if (cancelledRef.current) return;

      setStageIndex(5);
      await nextPaint();
      const measuredVideoTiers: VideoTierResult[] = [];
      for (let index = 0; index < videoTiers.length; index += 1) {
        setStatus(`Playing ${videoTiers[index].label} H.264 video`);
        const measured = await runVideoTier(videoTiers[index]);
        measuredVideoTiers.push(measured);
        setProgress(62 + ((index + 1) / videoTiers.length) * 10);
        if (
          !measured.valid ||
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
              valid: false,
              measurementSource: "unavailable",
              mediaAdvancedMs: 0,
            });
          }
          break;
        }
      }
      if (cancelledRef.current) return;

      setStageIndex(6);
      await nextPaint();
      const multitaskTiers: LatencyTierResult[] = [];
      const maxWorkers = Math.max(
        1,
        Math.min(4, (navigator.hardwareConcurrency || 2) - 1),
      );
      for (let level = 0; level < 4; level += 1) {
        const tier = workloadTiers[level + 1];
        const multitaskDataset = buildEmailDataset(1700 + level, tier.size);
        const workerCount = Math.min(maxWorkers, level + 1);
        setStatus(`${friendlyProgressLevel(tier.id)} while other work continues`);
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
        await measureJourney(
          "multitasking",
          tier,
          3000 + level * 100,
          multitaskDataset,
        );
        const samples: TimedSample[] = [];
        const repetitions = level === 3 ? 8 : 3;
        for (let repetition = 0; repetition < repetitions; repetition += 1) {
          samples.push(
            await measureJourney(
              "multitasking",
              tier,
              3100 + level * 100 + repetition,
              multitaskDataset,
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
        setProgress(72 + ((level + 1) / 4) * 20);
        if (median(samples.map((sample) => sample.durationMs)) > 3000) {
          for (let remaining = level + 1; remaining < 4; remaining += 1) {
            const skipped = workloadTiers[remaining + 1];
            multitaskTiers.push({
              id: skipped.id,
              label: skipped.label,
              earlyStopped: true,
              samples: [
                {
                  durationMs: 6000,
                  workMs: 6000,
                  presentationMs: 0,
                  checksum: 0,
                  actions: [],
                },
              ],
            });
          }
          break;
        }
      }
      if (cancelledRef.current) return;

      setStageIndex(7);
      await nextPaint();
      const storageTiers: StorageTierResult[] = [];
      let database: IDBDatabase | null = null;
      try {
        database = await openStorageDatabase();
        for (const [index, size] of [1, 8, 32].entries()) {
          setStatus("Saving and reopening temporary browser data");
          storageTiers.push(await runStorageTier(database, size, index));
          setProgress(92 + ((index + 1) / 3) * 6);
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
      const formFactor = detectFormFactor();
      const summary = summarizeThoroughRun({
        browsingTiers: browsingResults,
        emailTiers: emailResults,
        writingTiers: writingResults,
        spreadsheetTiers: spreadsheetResults,
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
        formFactor,
        powerSource: "not-reported",
        logicalProcessors: navigator.hardwareConcurrency || null,
        cadenceMs,
        startedAt,
        elapsedMs: performance.now() - testStart,
        profileVersion: "6.0.0-adaptive-headroom",
        raw: {
          headroomPolicy: {
            baseRepetitions: 5,
            headroomRepetitions: 3,
            firstGate: {
              medianMs: 450,
              worstMs: 1000,
              maximumCv: 0.35,
            },
            secondGate: {
              medianMs: 850,
              worstMs: 2000,
              maximumCv: 0.45,
            },
          },
          browsingTiers: browsingResults,
          emailTiers: emailResults,
          writingTiers: writingResults,
          spreadsheetTiers: spreadsheetResults,
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
            schemaVersion: "stillgood-result.v6",
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
    link.download = `stillgood-everyday-check-${Date.now()}.json`;
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
        </header>
        {notice && (
          <p className="simple-notice" role="status">
            {notice}
          </p>
        )}
        <section className="simple-hero">
          <p className="kicker">A second-life computer check</p>
          <h1>What is this computer still good for?</h1>
          <p className="simple-lede">
            One automatic test. A clear answer. Usually two to four minutes.
          </p>
          <button className="start-orb" onClick={begin}>
            <span>Start</span>
            <small>the test</small>
          </button>
          <p className="quiet-instruction">
            Keep this tab visible and leave the computer alone until it finishes.
          </p>
        </section>
        <details className="home-details">
          <summary>What does it test?</summary>
          <div className="home-detail-grid">
            {stages.map((item) => (
              <article key={item.id}>
                <strong>{item.name}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className="scope-note">
            It measures this browser and computer together. It cannot inspect
            battery health, temperature, total RAM use, or every desktop app.
          </p>
        </details>
        <footer className="simple-footer">
          <span>Private by design · local workloads · exportable results</span>
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
            <span>of 8</span>
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
            browsingView={browsingView}
            emailView={emailView}
            writingView={writingView}
            spreadsheetView={spreadsheetView}
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
  const guide = buildCapabilityGuide(result);
  const categoryCards = [
    ["Web browsing", result.browsing],
    ["Email and webmail", result.email],
    ["Documents", result.writing],
    ["Spreadsheets", result.spreadsheets],
    ["Using several things", result.multitasking],
    ["Scrolling and visuals", result.graphics],
    ["Video playback", result.video],
    ["Saving browser data", result.storage],
  ] as const;
  const verdict =
    result.formFactor === "mobile"
      ? result.grade === "A+"
        ? "Excellent browser performance on this mobile device."
        : result.grade === "A"
          ? "Strong browser performance on this mobile device."
          : "This mobile result shows where browser performance begins to slow."
      : result.grade === "A+"
        ? "Fast enough to feel modern in this browser."
        : result.grade === "A"
          ? "Comfortable for everyday browser-based computing."
          : result.grade.startsWith("B")
            ? "A genuinely useful second-life computer."
            : result.grade.startsWith("C")
              ? "Useful for focused, lighter work."
              : "Best assigned one simple job at a time.";

  return (
    <>
    <main className="result-page">
      <header className="simple-header">
        <button
          className="simple-brand brand-button"
          onClick={() => setPhase("home")}
        >
          <span>S</span> StillGood
        </button>
        <span className="status-label">Confidence: {result.confidence}</span>
      </header>
      <section className="clear-answer">
        <div className="answer-grade answer-grade-wide">{result.grade}</div>
        <div>
          <p className="kicker">
            {result.ceilingReached
              ? "Above the current test ceiling"
              : `${result.formFactor === "mobile" ? "Mobile result · " : ""}${result.label}`}
          </p>
          <h1>{verdict}</h1>
          <p>
            Browsing: <strong>{guide.browsingLabel}</strong>. Office:{" "}
            <strong>{guide.officeLabel}</strong>. Multitasking:{" "}
            <strong>{guide.multitaskingLabel}</strong>.
          </p>
        </div>
      </section>
      <section className="result-at-a-glance" aria-label="Result at a glance">
        <article>
          <span>Web browsing</span>
          <strong>{guide.browsingLabel}</strong>
        </article>
        <article>
          <span>Office work</span>
          <strong>{guide.officeLabel}</strong>
        </article>
        <article>
          <span>Multitasking</span>
          <strong>{guide.multitaskingLabel}</strong>
        </article>
      </section>
      <section className="guide-invite">
        <div>
          <p className="kicker">Detailed report</p>
          <h2>What can you actually do with it?</h2>
          <p>{guide.summary}</p>
        </div>
        <button className="guide-action" onClick={() => setShowGuide(true)}>
          Open detailed report
          <span aria-hidden="true">↗</span>
        </button>
      </section>
      <details className="result-breakdown">
        <summary>See all eight test results</summary>
        <section className="check-results check-results-six">
          {categoryCards.map(([name, category]) => (
            <article key={name}>
              <div>
                <strong>{name}</strong>
                <span>{categoryOutcome(category)}</span>
              </div>
              <p>{categoryDescriptions[name]}</p>
            </article>
          ))}
        </section>
      </details>
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
          <button
            className="secondary-action"
            onClick={() => setShowGuide(true)}
          >
            Detailed report
          </button>
          <button className="primary-action" onClick={downloadResult}>
            Export full result
          </button>
        </div>
      </section>
      {result.integrityNotes.length > 0 && (
        <aside className="integrity-note">
          <strong>Measurement note</strong>
          {result.integrityNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </aside>
      )}
      <p className="plain-result-note">
        This is a practical check of this browser and computer together.
        Different browsers and desktop applications can behave differently.
        Full measurements remain available in the exported result.
      </p>
    </main>
    {showGuide && (
      <div
        className="guide-overlay"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowGuide(false);
        }}
      >
        <section
          className="capability-flyer detailed-report"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
        >
          <button
            className="guide-close"
            onClick={() => setShowGuide(false)}
            aria-label="Close detailed report"
          >
            ×
          </button>
          <header className="flyer-brand">
            <span className="flyer-mark">S</span>
            <strong>StillGood</strong>
            <small>Detailed report</small>
          </header>
           <div className="flyer-hero">
             <div className="flyer-grade">{result.grade}</div>
             <div>
               <p>{result.label}</p>
               <h2 id="report-title">{guide.headline}</h2>
               <span>{guide.summary}</span>
             </div>
          </div>
          <div className="flyer-levels">
             <article>
               <span>Web browsing</span>
               <strong>{guide.browsingLabel}</strong>
             </article>
             <article>
               <span>Office work</span>
               <strong>{guide.officeLabel}</strong>
             </article>
             <article>
               <span>Video playback</span>
               <strong>{guide.videoLabel}</strong>
             </article>
            <article>
              <span>Multitasking</span>
              <strong>{guide.multitaskingLabel}</strong>
            </article>
          </div>
           <section className="report-measurements">
             <div className="report-section-heading">
               <div>
                 <p>What the test found</p>
                 <h3>A plain-language view of everyday work</h3>
               </div>
             </div>
             <div className="report-score-grid">
               {categoryCards.map(([name, category]) => (
                 <article className="report-score-card" key={name}>
                   <div className="report-score-topline">
                     <strong>{name}</strong>
                     <span>{categoryOutcome(category)}</span>
                   </div>
                   <p>{categoryDescriptions[name]}</p>
                 </article>
               ))}
             </div>
          </section>
          <div className="flyer-columns">
            <section>
              <p className="flyer-section-label">A good fit for</p>
              <div className="flyer-items">
                {guide.bestFor.map(
                  (item: { title: string; detail: string }, index: number) => (
                    <article key={item.title}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>
            <section>
              <p className="flyer-section-label">Use with care</p>
              <div className="flyer-cautions">
                {guide.cautions.map(
                  (item: { title: string; detail: string }) => (
                    <article key={item.title}>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </article>
                  ),
                )}
              </div>
            </section>
          </div>
          <section className="report-context">
            <p className="flyer-section-label">Test context</p>
            <div className="report-context-grid">
              <article>
                <span>Browser</span>
                <strong>{result.browser}</strong>
              </article>
               <article>
                 <span>System</span>
                 <strong>{result.platform}</strong>
               </article>
               <article>
                 <span>Test duration</span>
                 <strong>{Math.max(1, Math.round(result.elapsedMs / 60000))} minutes</strong>
               </article>
               <article>
                <span>Confidence</span>
                <strong>{result.confidence}</strong>
              </article>
            </div>
          </section>
          <footer className="flyer-footer">
            <div>
              <span>Best setup</span>
              <strong>{guide.setup}</strong>
            </div>
            <button onClick={() => window.print()}>Print or save PDF</button>
          </footer>
          <p className="flyer-disclosure">
            Based on this browser and device together. Streaming services and
            desktop applications can behave differently.
          </p>
        </section>
      </div>
    )}
    </>
  );
}

function BenchmarkVisual({
  stage,
  tick,
  browsingView,
  emailView,
  writingView,
  spreadsheetView,
  videoRef,
  canvasRef,
}: {
  stage: StageId;
  tick: number;
  browsingView: BrowsingView | null;
  emailView: EmailView | null;
  writingView: WritingView | null;
  spreadsheetView: SpreadsheetView | null;
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
      <div className="test-visual multitask-fixture">
        <EmailFixture view={emailView} compact />
        <div className="pressure-strip">
          {["Foreground", "Search", "Workers"].map((label, index) => (
            <span key={label} className={index === tick % 3 ? "active" : ""}>
              {label}
            </span>
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
  if (stage === "browsing")
    return (
      <div className="test-visual fixture-host">
        <BrowsingFixture view={browsingView} />
      </div>
    );
  if (stage === "writing")
    return (
      <div className="test-visual fixture-host">
        <WritingFixture view={writingView} />
      </div>
    );
  if (stage === "spreadsheets")
    return (
      <div className="test-visual fixture-host">
        <SpreadsheetFixture view={spreadsheetView} />
      </div>
    );
  return (
    <div className="test-visual fixture-host">
      <EmailFixture view={emailView} />
    </div>
  );
}

function BrowsingFixture({ view }: { view: BrowsingView | null }) {
  if (!view)
    return <div className="fixture-loading">Preparing local practice pages…</div>;

  return (
    <section className={`browse-app ${view.layout}`}>
      <header>
        <strong>Fieldnotes</strong>
        <nav aria-label="Practice site navigation">
          <span>News</span>
          <span>Guides</span>
          <span>Reviews</span>
          <span>Community</span>
        </nav>
        <small>{view.actionName}</small>
      </header>
      <div className="browse-toolbar">
        <input
          value={view.query}
          readOnly
          placeholder="Search"
          aria-label="Practice site search"
        />
        <span>Local test pages</span>
      </div>
      {view.layout === "article" && view.article ? (
        <div className="browse-article-layout">
          <article className="browse-article">
            <p>{view.article.category}</p>
            <h2>{view.article.title}</h2>
            <div
              className="browse-hero-image"
              style={{ "--hue": view.article.hue } as CSSProperties}
            />
            {view.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
          <aside>
            <strong>Related</strong>
            {view.items.slice(0, 8).map((item) => (
              <span key={item.id}>{item.title}</span>
            ))}
          </aside>
        </div>
      ) : (
        <div className={view.layout === "catalog" ? "browse-grid" : "browse-list"}>
          {view.items.map((item) => (
            <article key={item.id}>
              <div
                className="browse-card-image"
                style={{ "--hue": item.hue } as CSSProperties}
              />
              <div>
                <small>{item.category}</small>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                {view.layout === "catalog" && (
                  <span>
                    ${item.price} · {item.rating.toFixed(1)} stars
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EmailFixture({
  view,
  compact = false,
}: {
  view: EmailView | null;
  compact?: boolean;
}) {
  if (!view)
    return <div className="fixture-loading">Preparing the practice inbox…</div>;
  return (
    <section className={`inbox-app ${compact ? "compact" : ""}`}>
      <header>
        <strong>Practice inbox</strong>
        <span>{view.actionName}</span>
        <label>
          Search
          <input value={view.query} readOnly />
        </label>
      </header>
      <aside>
        {["inbox", "archive", "sent"].map((folder) => (
          <span key={folder} className={folder === view.folder ? "active" : ""}>
            {folder}
          </span>
        ))}
      </aside>
      <div className="message-list">
        {view.rows.map((message) => (
          <article
            key={message.id}
            className={`${message.unread ? "unread" : ""} ${message.selected ? "selected" : ""}`}
          >
            <i aria-hidden="true" />
            <strong>{message.sender}</strong>
            <span>{message.subject}</span>
            {message.label && <em>{message.label}</em>}
          </article>
        ))}
      </div>
      <div className="message-preview">
        {view.draftBlocks.length ? (
          <>
            <strong>Rich reply draft</strong>
            <div className="rich-draft">
              {view.draftBlocks.map((block, index) => (
                <p key={block}>
                  {index === 1 ? <strong>{block}</strong> : block}
                </p>
              ))}
            </div>
          </>
        ) : view.activeMessage ? (
          <>
            <strong>{view.activeMessage.subject}</strong>
            <span>{view.activeMessage.sender}</span>
            <div className={`mail-thread ${view.activeMessage.kind}`}>
              {view.thread.map((message) => (
                <article key={message.id}>
                  <strong>{message.sender}</strong>
                  <p>{message.body}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <strong>Searching the practice inbox</strong>
            <p>Messages are being opened, sorted, and updated.</p>
          </>
        )}
      </div>
    </section>
  );
}

function WritingFixture({ view }: { view: WritingView | null }) {
  if (!view)
    return <div className="fixture-loading">Preparing the practice document…</div>;
  return (
    <section className="document-app">
      <header>
        <strong>{view.title}</strong>
        <span>{view.actionName}</span>
        <small>Practice document · {view.layoutMode}</small>
        {view.saved && <em>Saved and reopened</em>}
      </header>
      <div className="document-toolbar">
        <button tabIndex={-1}>B</button>
        <button tabIndex={-1}>Find</button>
        <input value={view.query} readOnly aria-label="Document search" />
        <span>{view.matchCount ? `${view.matchCount} matches` : "Ready"}</span>
      </div>
      <article
        className="editor-surface"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Practice document"
        style={{ maxWidth: `${view.editorWidth}px` }}
      >
        {view.paragraphs.map((paragraph) => {
          const content = paragraph.bold ? (
            <strong>{paragraph.text}</strong>
          ) : paragraph.italic ? (
            <em>{paragraph.text}</em>
          ) : (
            paragraph.text
          );
          return paragraph.heading ? (
            <h3 key={paragraph.id} className={paragraph.match ? "match" : ""}>
              {content}
            </h3>
          ) : (
            <p key={paragraph.id} className={paragraph.match ? "match" : ""}>
              {content}
            </p>
          );
        })}
        {view.tableRows.length > 0 && <table>
          <thead>
            <tr>
              <th>Device</th>
              <th>Year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {view.tableRows.map((row) => (
              <tr key={row.id}>
                <td>{row.model}</td>
                <td>{row.year}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </article>
    </section>
  );
}

function SpreadsheetFixture({ view }: { view: SpreadsheetView | null }) {
  if (!view)
    return <div className="fixture-loading">Preparing the practice workbook…</div>;
  return (
    <section className="spreadsheet-app">
      <header>
        <strong>{view.title}</strong>
        <span>{view.actionName}</span>
        <small>Practice spreadsheet · live calculations</small>
      </header>
      <div className="sheet-toolbar">
        <span>fx</span>
        <input
          value={
            view.query ||
            (view.pasteCount
              ? "Pasted data and updated formulas"
              : "Recalculated workbook formulas")
          }
          readOnly
          aria-label="Spreadsheet formula or operation"
        />
        <strong>{view.visibleMatches.toLocaleString()} matching rows</strong>
      </div>
      <div className="sheet-grid" role="grid" aria-label="Practice spreadsheet">
        <div className="sheet-row sheet-heading" role="row">
          <span>#</span>
          {["Device", "Year", "Status", "Qty", "Price", "Subtotal", "Running total", "Flag", "Asset", "Score"].map(
            (label) => <span key={label}>{label}</span>,
          )}
        </div>
        {view.rows.map((row) => (
          <div className="sheet-row" role="row" key={row.row}>
            <span>{row.row}</span>
            {row.cells.map((cell, index) => (
              <span role="gridcell" key={`${row.row}-${index}`}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
