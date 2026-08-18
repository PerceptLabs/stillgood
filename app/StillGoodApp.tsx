"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import legacyPdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import {
  median,
  percentile,
  qualifiesForHeadroom,
  summarizeGraphicsFrames,
  summarizeThoroughRun,
} from "@/lib/scoring.mjs";
import { classifyFormFactor } from "@/lib/context.mjs";
import {
  buildCapabilityGuide,
  runQualityLabel,
} from "@/lib/capability-guide.mjs";
import { planBoundaryConfirmation } from "@/lib/boundary-confirmation.mjs";
import {
  planUpperReserve,
  shouldRunExtendedReserve,
} from "@/lib/upper-reserve.mjs";
import {
  compatibilityAdapterProfile,
  planMemoryPressureLevels,
} from "@/lib/benchmark-compatibility.mjs";
import { browserEvidenceProfile } from "@/lib/browser-evidence-policy.mjs";
import { buildAnonymousTelemetry } from "@/lib/anonymous-telemetry.mjs";
import {
  consolidateVideoTierAttempts,
  needsVideoConfirmation,
  shouldAttempt4k,
  shouldAttemptExtendedVideo,
} from "@/lib/video-headroom.mjs";
import {
  clearLocalRuns,
  getLocalRun,
  listLocalRuns,
  saveLocalRun,
  type LocalRunSummary,
  type RecentRunRange,
} from "@/lib/local-run-history";
import { summarizeRecentRunRange } from "@/lib/run-repeatability.mjs";
import { summarizeShadowV7 } from "@/lib/shadow-scoring-v7.mjs";
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
import { buildBenchmarkPdf } from "@/lib/advanced-workloads.mjs";
import { preflightOptionalReserveComponents } from "@/lib/reserve-component-preflight.mjs";

type Phase = "home" | "prepare" | "run" | "result";
type StageId =
  | "browsing"
  | "email"
  | "writing"
  | "spreadsheets"
  | "graphics"
  | "video"
  | "multitasking"
  | "memory"
  | "storage"
  | "reserve";
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
  actions: Array<{
    name: string;
    durationMs: number;
    workMs: number;
    presentationMs: number;
  }>;
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
  expectedFrameCount: number;
  displayCadenceMs: number;
  evaluationCadenceMs: number;
  valid?: boolean;
};
type VideoTierResult = {
  id: string;
  label: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  headroom?: boolean;
  skipped?: boolean;
  skipReason?: string;
  capabilitySupported?: boolean | null;
  capabilitySmooth?: boolean | null;
  capabilityPowerEfficient?: boolean | null;
  confirmationRuns?: number;
  initialDroppedRatio?: number;
  attemptDroppedRatios?: number[];
  attemptStallDurationsMs?: number[];
  droppedRatio: number;
  stalls: number;
  stallDurationMs: number;
  longestStallMs: number;
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
type StrictStorageTierResult = {
  id: string;
  label: string;
  transactionCount: number;
  payloadKB: number;
  medianCommitMs: number;
  p95CommitMs: number;
  worstCommitMs: number;
  readbackMs: number;
  verified: boolean;
};
type OpfsStorageTierResult = {
  id: string;
  label: string;
  sizeMB: number;
  randomReads: number;
  writeMs: number;
  flushMs: number;
  reopenMs: number;
  randomReadMs: number;
  flushP95Ms: number;
  flushWorstMs: number;
  coldWriteMs: number | null;
  coldFlushMs: number | null;
  coldReopenMs: number | null;
  coldRandomReadMs: number | null;
  foregroundP95Ms: number;
  foregroundWorstMs: number;
  samples: Array<{
    writeMs: number;
    flushMs: number;
    reopenMs: number;
    randomReadMs: number;
    verified: boolean;
  }>;
  verified: boolean;
  available: boolean;
  error?: string;
};
type MemoryTierResult = {
  id: string;
  label: string;
  targetMB: number;
  retainedMB: number;
  addedMB: number;
  allocator: "webassembly" | "typed-array";
  allocationMs: number;
  scanMs: number;
  scannedMB: number;
  sweepMBps: number;
  gcChurnMs: number;
  gcWorstRoundMs: number;
  gcObjectsCreated: number;
  copyRoundTripMs: number;
  probeP95Ms: number;
  probeWorstMs: number;
  probeSamples: number[];
  checksum: number;
};
type MixedReserveLevel = {
  id: "standard" | "extended";
  label: string;
  durationMs: number;
  baselineP95Ms: number;
  baselineWorstMs: number;
  loadedP95Ms: number;
  loadedWorstMs: number;
  slowdownRatio: number;
  actionCount: number;
  hitch250Ratio: number;
  hitch500Ratio: number;
  onTimeRatio: number;
  longFrameRatio: number;
  worstFrameMs: number;
  videoDroppedRatio: number | null;
  imageEditP95Ms: number | null;
  imageEditAvailable: boolean;
  memoryPressureMB: number;
  storagePressureMB: number;
  workerCount: number;
  pdfP95Ms: number | null;
  pdfAvailable: boolean;
  pdfBuild: "modern" | "legacy" | "legacy-safe" | null;
  pdfFailureStage:
    | "modern-load"
    | "modern-render"
    | "legacy-load"
    | "legacy-render"
    | "legacy-safe-load"
    | "legacy-safe-render"
    | null;
  advancedAvailable: boolean;
  advancedBaselineP95Ms: number | null;
  advancedLoadedP95Ms: number | null;
  advancedWorstMs: number | null;
  advancedSlowdownRatio: number | null;
  advancedBaselineStartupMs: number | null;
  advancedStartupMs: number | null;
  advancedCombinedMedianMs: number | null;
  advancedSqliteP95Ms: number | null;
  advancedParserP95Ms: number | null;
  advancedJsonP95Ms: number | null;
  advancedBaselineIterations: number | null;
  advancedIterations: number | null;
};
type MixedReserveResult = MixedReserveLevel & {
  tested: true;
  paired: true;
  fallbackUsed: boolean;
  levels: MixedReserveLevel[];
};
type ReservePhase =
  | "not-started"
  | "component-preflight"
  | "advanced-baseline"
  | "paired-baseline"
  | "pressure-setup"
  | "paired-loaded"
  | "cleanup"
  | "complete";
type AdvancedWorkSummary = {
  medianMs: number;
  p95Ms: number;
  worstMs: number;
};
type AdvancedWorkResult = {
  type: "advanced-web-work-complete";
  requestId: string;
  level: "baseline" | "standard" | "extended";
  workloadProfile?: string;
  available: boolean;
  startupMs?: number;
  elapsedMs?: number;
  iterations?: number;
  checksum?: number;
  sqliteVersion?: string;
  error?: string;
  summary?: {
    sqlite: AdvancedWorkSummary;
    parser: AdvancedWorkSummary;
    json: AdvancedWorkSummary;
    combined: AdvancedWorkSummary;
  };
};
type PdfBenchmarkDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getViewport(options: { scale: number }): { width: number; height: number };
    getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
    render(options: {
      canvas: HTMLCanvasElement;
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }): { promise: Promise<void> };
    cleanup?(): void;
  }>;
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
  everydayScore?: number;
  capacityScore?: number;
  available?: boolean;
  invalidTierCount?: number;
  highestComfortable: string;
  highestUsable: string;
  tiers: TierSummary[];
  testedHeadroom?: boolean;
  headroomCeiling?: boolean;
  limitFound?: boolean;
};
type ResponsivenessSummary = {
  available: boolean;
  score: number | null;
  label: string;
  actionCount: number;
  p50Ms: number | null;
  p75Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  worstMs: number | null;
  hitch250Ratio: number | null;
  hitch500Ratio: number | null;
  longFrameRatePerMinute: number | null;
  blockingBurdenRatio: number | null;
};
type HeadroomSummary = {
  score: number;
  label: string;
  openCeilings: number;
  extendedCategories: number;
};
type BrowserSupportSummary = {
  level: "reference" | "experimental" | "unvalidated";
  label: string;
  detail: string;
};
type EvidenceGroupsSummary = {
  profileVersion: string;
  postScoreNormalizationApplied: false;
  webExperience: {
    score: number;
    label: string;
    preserveBrowserDifferences: true;
    categories: readonly string[];
  };
  resourceResilience: {
    score: number;
    label: string;
    preserveBrowserDifferences: false;
    treatment: string;
    categories: readonly string[];
  };
};
type SimpleCategory = {
  score: number;
  available?: boolean;
  invalidTierCount?: number;
  highestComfortable?: string;
  highestUsable?: string;
  largeSaveScore?: number | null;
  largeSaveStatus?: string;
  largeSaveLabel?: string;
  largeFlushMs?: number | null;
  largeFlushWorstMs?: number | null;
  coldLargeFlushMs?: number | null;
  saveForegroundP95Ms?: number | null;
  reserveLabel?: string;
  reportedMemoryLabel?: string;
  gradeCeiling?: number;
  topGradeEligible?: boolean;
  testedHeadroom?: boolean;
  headroomCeiling?: boolean;
  limitFound?: boolean;
  tiers: Array<{ id: string; label: string; status: string }>;
};
type ThoroughResult = {
  grade: string;
  label: string;
  score: number;
  ceilingReached: boolean;
  confidence: string;
  variability: number;
  browsing: LatencyCategory;
  email: LatencyCategory;
  writing: LatencyCategory;
  spreadsheets: LatencyCategory;
  multitasking: LatencyCategory;
  graphics: SimpleCategory;
  video: SimpleCategory;
  memory: SimpleCategory;
  storage: SimpleCategory;
  responsiveness: ResponsivenessSummary;
  headroom: HeadroomSummary;
  upperReserve: {
    tested: boolean;
    score: number | null;
    label: string;
    gradeCeiling: number;
    components: Array<{ id: string; score: number; weight: number }>;
    levels?: Array<{ id: string; score: number; score1000: number }>;
  };
  internalScoring: {
    scale: 1000;
    aggregation: string;
    compositeBeforeSafeguards: number;
    baseBeforeReserve: number;
    baseAfterReserveCap: number;
    baseForReserve: number;
    reserveAward: {
      tested: boolean;
      standardScore1000: number | null;
      extendedScore1000: number | null;
      standardBonus1000: number;
      extendedBonus1000: number;
      totalBonus1000: number;
      standardStrength: number;
      extendedStrength: number;
      fillFraction: number;
      remaining1000: number;
    };
    final: number;
    publicScore: number;
    matrix: Record<string, Record<string, number | null>>;
    safeguards: Record<string, number>;
  };
  evidenceGroups: EvidenceGroupsSummary;
  browserSupport: BrowserSupportSummary;
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
  boundaryConfirmation?: {
    triggered: boolean;
    margin: number;
    reason: string;
    gradeBoundary: number | null;
    capabilityBoundaries: Array<{ category: string; boundary: number }>;
    plannedCategories: string[];
    runs: Array<{ category: string; tier: string; addedSamples: number }>;
    scoreBefore: number;
    gradeBefore: string;
    scoreAfter: number;
    gradeAfter: string;
  };
  recentRunRange?: RecentRunRange;
  shadowScoring: ReturnType<typeof summarizeShadowV7>;
  raw: unknown;
};
type SavedRunSummary = LocalRunSummary;

const ANONYMOUS_SHARING_KEY = "stillgood-share-anonymous-measurements";

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
    detail:
      "Local video at everyday resolutions, with higher-resolution checks when useful.",
  },
  {
    id: "multitasking",
    name: "Multitasking",
    title: "Responsiveness under pressure",
    detail: "Checks whether the computer stays responsive when work overlaps.",
  },
  {
    id: "memory",
    name: "Memory",
    title: "Responsiveness under memory pressure",
    detail: "Keeps larger working sets active and watches for catch-up pauses.",
  },
  {
    id: "storage",
    name: "Storage",
    title: "Persistent browser storage",
    detail: "Commits small changes, flushes local files, reopens them, and verifies the data.",
  },
];

const reserveStage = {
  id: "reserve" as const,
  name: "Reserve",
  title: "Performance reserve",
  detail:
    "Everyday actions are repeated while a large PDF, data app, and other jobs overlap.",
};

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

const ordinaryVideoTiers = [
  {
    id: "480p",
    label: "480p",
    width: 854,
    height: 480,
    frameRate: 30,
    bitrate: 1400000,
    codec: "avc1.640028",
    src: "/benchmark-assets/video-480p.mp4",
    durationMs: 4500,
  },
  {
    id: "720p",
    label: "720p",
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 3100000,
    codec: "avc1.640028",
    src: "/benchmark-assets/video-720p.mp4",
    durationMs: 4500,
  },
  {
    id: "1080p",
    label: "1080p",
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 6300000,
    codec: "avc1.640028",
    src: "/benchmark-assets/video-1080p.mp4",
    durationMs: 4500,
  },
];

const extendedVideoTiers = [
  {
    id: "1080p60",
    label: "1080p60",
    width: 1920,
    height: 1080,
    frameRate: 60,
    bitrate: 8600000,
    codec: "avc1.64002a",
    src: "/benchmark-assets/video-1080p60.mp4",
    durationMs: 4500,
    headroom: true,
  },
  {
    id: "1440p",
    label: "1440p",
    width: 2560,
    height: 1440,
    frameRate: 30,
    bitrate: 10100000,
    codec: "avc1.640032",
    src: "/benchmark-assets/video-1440p.mp4",
    durationMs: 4500,
    headroom: true,
  },
  {
    id: "4k",
    label: "4K",
    width: 3840,
    height: 2160,
    frameRate: 30,
    bitrate: 21800000,
    codec: "avc1.640033",
    src: "/benchmark-assets/video-4k.mp4",
    durationMs: 4500,
    headroom: true,
  },
] as const;

type VideoTier =
  | (typeof ordinaryVideoTiers)[number]
  | (typeof extendedVideoTiers)[number];
type VideoCapability = {
  supported: boolean | null;
  smooth: boolean | null;
  powerEfficient: boolean | null;
};

async function videoCapabilityFor(tier: VideoTier): Promise<VideoCapability> {
  try {
    if (!navigator.mediaCapabilities?.decodingInfo) {
      return { supported: null, smooth: null, powerEfficient: null };
    }
    const capability = await navigator.mediaCapabilities.decodingInfo({
      type: "file",
      video: {
        contentType: `video/mp4; codecs="${tier.codec}"`,
        width: tier.width,
        height: tier.height,
        bitrate: tier.bitrate,
        framerate: tier.frameRate,
      },
    });
    return {
      supported: capability.supported,
      smooth: capability.smooth,
      powerEfficient: capability.powerEfficient,
    };
  } catch {
    return { supported: null, smooth: null, powerEfficient: null };
  }
}

function skippedVideoTier(
  tier: VideoTier,
  skipReason: string,
  capability: VideoCapability = {
    supported: null,
    smooth: null,
    powerEfficient: null,
  },
): VideoTierResult {
  return {
    ...tier,
    skipped: true,
    skipReason,
    capabilitySupported: capability.supported,
    capabilitySmooth: capability.smooth,
    capabilityPowerEfficient: capability.powerEfficient,
    droppedRatio: 0,
    stalls: 0,
    stallDurationMs: 0,
    longestStallMs: 0,
    completed: false,
    totalFrames: 0,
    valid: false,
    measurementSource: "unavailable",
    mediaAdvancedMs: 0,
  };
}

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

function browserFamily() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Edg/") || ua.includes("Chrome/")) return "chromium";
  if (ua.includes("Safari/")) return "safari";
  return "unknown";
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

async function measureIdleBaseline(durationMs = 2200) {
  const lags: number[] = [];
  const started = performance.now();
  while (performance.now() - started < durationMs) {
    const probe = performance.now();
    await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    lags.push(Math.max(0, performance.now() - probe - 50));
  }
  const sorted = [...lags].sort((a, b) => a - b);
  const p95 =
    sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] ??
    0;
  const worst = Math.max(...lags, 0);
  const hitchCount = lags.filter((lag) => lag > 50).length;
  return {
    sampleCount: lags.length,
    p95LagMs: p95,
    worstLagMs: worst,
    hitchCount,
    unsettled: p95 > 35 || worst > 180 || hitchCount >= 3,
  };
}

function resultEnvelope(result: ThoroughResult) {
  return {
    schemaVersion: "stillgood-result.v6.25",
    result,
    disclosure:
      "This describes browser-observed behavior, not a system-wide hardware diagnosis.",
  };
}

function downloadJsonFile(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
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
      reserve: "Checking sustained performance reserve",
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
  if (category.score >= 86) return "Comfortable";
  if (category.score >= 76) return "Practical";
  if (category.score >= 66) return "Best kept light";
  if (category.score >= 56) return "May feel slow";
  return "Not recommended";
}

const categoryDescriptions: Record<string, string> = {
  "Web browsing": "Articles, search results, shopping pages, navigation, and filters.",
  "Email and webmail": "Searching, opening conversations, and writing replies.",
  Documents: "Typing, formatting, tables, and changing page layout.",
  Spreadsheets: "Formulas, sorting, filtering, pasting, and scrolling.",
  Multitasking: "Keeping several browser tasks responsive while work overlaps.",
  "Responsiveness under memory pressure":
    "Keeping larger working sets active without catch-up pauses.",
  "Scrolling and visuals": "Keeping movement and animated pages smooth.",
  "Video playback": "Playing common video sizes without interruptions.",
  "Persistent saves":
    "Committing, flushing, reopening, and verifying local browser data.",
};

async function openStorageDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("stillgood-thorough-check", 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("blocks"))
        request.result.createObjectStore("blocks");
      if (!request.result.objectStoreNames.contains("commits"))
        request.result.createObjectStore("commits");
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

function percentileValue(values: number[], percentile: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * percentile) - 1)
  ];
}

async function runStrictStorageTier(
  database: IDBDatabase,
  transactionCount: number,
  payloadKB: number,
  tierIndex: number,
): Promise<StrictStorageTierResult> {
  const payload = new Uint8Array(payloadKB * 1024);
  for (let offset = 0; offset < payload.length; offset += 4096)
    payload[offset] = (tierIndex * 37 + offset) & 255;
  const commits: number[] = [];

  for (let index = -3; index < transactionCount; index += 1) {
    const started = performance.now();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        "commits",
        "readwrite",
        { durability: "strict" },
      );
      transaction
        .objectStore("commits")
        .put(payload, `${tierIndex}-${index}`);
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
    if (index >= 0) commits.push(performance.now() - started);
  }

  let verified = true;
  const readbackStart = performance.now();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("commits", "readonly");
    const store = transaction.objectStore("commits");
    for (let index = 0; index < transactionCount; index += 1) {
      const request = store.get(`${tierIndex}-${index}`);
      request.onsuccess = () => {
        verified =
          verified &&
          request.result instanceof Uint8Array &&
          request.result.byteLength === payload.byteLength;
      };
    }
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });

  return {
    id: `strict-${transactionCount}`,
    label: `${transactionCount} small saves`,
    transactionCount,
    payloadKB,
    medianCommitMs: median(commits),
    p95CommitMs: percentileValue(commits, 0.95),
    worstCommitMs: Math.max(...commits, 0),
    readbackMs: performance.now() - readbackStart,
    verified,
  };
}

async function requestWorkerResult<T>(
  worker: Worker,
  message: Record<string, unknown>,
  expectedType: string,
  timeoutMs: number,
) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`${expectedType} timed out`));
    }, timeoutMs);
    const onMessage = (event: MessageEvent<T & { type?: string }>) => {
      if (event.data?.type !== expectedType) return;
      cleanup();
      resolve(event.data);
    };
    const onError = () => {
      cleanup();
      reject(new Error(`${expectedType} worker failed`));
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage(message);
  });
}

async function measureForegroundLagUntil(
  operation: Promise<unknown>,
  maximumMs = 30000,
) {
  let finished = false;
  void operation.then(
    () => {
      finished = true;
    },
    () => {
      finished = true;
    },
  );
  const samples: number[] = [];
  const started = performance.now();
  while (
    !finished &&
    performance.now() - started < maximumMs &&
    !document.hidden
  ) {
    const probe = performance.now();
    await sleep(25);
    samples.push(Math.max(0, performance.now() - probe - 25));
  }
  return samples;
}

async function runMemoryTier(
  worker: Worker,
  targetMB: number,
  tierIndex: number,
): Promise<MemoryTierResult> {
  const copyBuffer = new Uint8Array(8 * 1024 * 1024);
  for (let offset = 0; offset < copyBuffer.length; offset += 4096)
    copyBuffer[offset] = (tierIndex * 31 + offset) & 255;
  const requestId = `memory-${tierIndex}-${Date.now()}`;
  const roundTripStart = performance.now();
  let copyRoundTripMs = 0;
  const workerMeasurement = requestWorkerResult<{
    type: string;
    retainedMB: number;
    addedMB: number;
    allocator: "webassembly" | "typed-array";
    allocationMs: number;
    scanMs: number;
    scannedMB: number;
    sweepMBps: number;
    gcChurnMs: number;
    gcWorstRoundMs: number;
    gcObjectsCreated: number;
    checksum: number;
  }>(
    worker,
    {
      type: "memory-pressure",
      requestId,
      targetMB,
      chunkMB: 32,
      scanDurationMs: 1100,
      scanStride: 64,
      gcRounds: 6,
      seed: 900 + tierIndex,
      copyBuffer: copyBuffer.buffer,
    },
    "memory-complete",
    25000,
  ).then((measured) => {
    copyRoundTripMs = performance.now() - roundTripStart;
    return measured;
  });
  const [measured, probeSamples] = await Promise.all([
    workerMeasurement,
    measureForegroundLagUntil(workerMeasurement, 24000),
  ]);

  return {
    id: `memory-${targetMB}`,
    label: `${targetMB} MB active`,
    targetMB,
    retainedMB: measured.retainedMB,
    addedMB: measured.addedMB,
    allocator: measured.allocator,
    allocationMs: measured.allocationMs,
    scanMs: measured.scanMs,
    scannedMB: measured.scannedMB,
    sweepMBps: measured.sweepMBps,
    gcChurnMs: measured.gcChurnMs,
    gcWorstRoundMs: measured.gcWorstRoundMs,
    gcObjectsCreated: measured.gcObjectsCreated,
    copyRoundTripMs,
    probeP95Ms: percentileValue(probeSamples, 0.95),
    probeWorstMs: Math.max(...probeSamples, 0),
    probeSamples,
    checksum: measured.checksum,
  };
}

async function runOpfsStorageTier(
  worker: Worker,
  sizeMB: number,
  randomReads: number,
  tierIndex: number,
): Promise<OpfsStorageTierResult> {
  const requestId = `opfs-${tierIndex}-${Date.now()}`;
  const workerMeasurement = requestWorkerResult<
    {
      type: string;
      available: boolean;
      samples?: OpfsStorageTierResult["samples"];
      verified?: boolean;
      error?: string;
    }
  >(
    worker,
    {
      type: "opfs-storage",
      requestId,
      sizeMB,
      randomReads,
      warmupCount: 1,
      repetitionCount: 3,
      seed: 1200 + tierIndex,
    },
    "opfs-complete",
    60000,
  );
  const [measured, foregroundSamples] = await Promise.all([
    workerMeasurement,
    measureForegroundLagUntil(workerMeasurement, 55000),
  ]);
  const samples = measured.samples ?? [];
  const coldSample = samples[0] ?? null;
  // The first observation remains useful evidence of a cold catch-up pause,
  // but repeat measurements describe normal sustained storage behavior.
  const steadySamples = samples.length > 1 ? samples.slice(1) : samples;
  const writeValues = steadySamples.map((sample) => sample.writeMs);
  const flushValues = steadySamples.map((sample) => sample.flushMs);
  const reopenValues = steadySamples.map((sample) => sample.reopenMs);
  const randomReadValues = steadySamples.map((sample) => sample.randomReadMs);
  return {
    id: `opfs-${sizeMB}`,
    label: `${sizeMB} MB persistent file`,
    sizeMB,
    randomReads,
    writeMs: median(writeValues),
    flushMs: median(flushValues),
    reopenMs: median(reopenValues),
    randomReadMs: median(randomReadValues),
    flushP95Ms: percentileValue(flushValues, 0.95),
    flushWorstMs: Math.max(...flushValues, 0),
    coldWriteMs: coldSample?.writeMs ?? null,
    coldFlushMs: coldSample?.flushMs ?? null,
    coldReopenMs: coldSample?.reopenMs ?? null,
    coldRandomReadMs: coldSample?.randomReadMs ?? null,
    foregroundP95Ms: percentileValue(foregroundSamples, 0.95),
    foregroundWorstMs: Math.max(...foregroundSamples, 0),
    samples,
    verified: measured.verified ?? false,
    available: measured.available,
    error: measured.error,
  };
}

export function StillGoodApp() {
  const [phase, setPhase] = useState<Phase>("home");
  const [stageIndex, setStageIndex] = useState(0);
  const [reserveStageActive, setReserveStageActive] = useState(false);
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
  const [showHistory, setShowHistory] = useState(false);
  const [savedRuns, setSavedRuns] = useState<SavedRunSummary[]>([]);
  const [historyStatus, setHistoryStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [shareAnonymous, setShareAnonymous] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "sending" | "shared" | "error"
  >("idle");
  const cancelledRef = useRef(false);
  const workersRef = useRef<Worker[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShareAnonymous(
        window.localStorage.getItem(ANONYMOUS_SHARING_KEY) === "true",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showGuide && !showHistory) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowGuide(false);
        setShowHistory(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showGuide, showHistory]);
  const visibleStages = reserveStageActive ? [...stages, reserveStage] : stages;
  const stage = visibleStages[stageIndex] ?? stages[0];

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

  function updateAnonymousSharing(enabled: boolean) {
    setShareAnonymous(enabled);
    window.localStorage.setItem(ANONYMOUS_SHARING_KEY, String(enabled));
  }

  async function saveResultAutomatically(completedResult: ThoroughResult) {
    setSaveStatus("saving");
    const envelope = resultEnvelope(completedResult);
    try {
      await saveLocalRun(envelope);
      setSavedRuns(await listLocalRuns());
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }

    if (!shareAnonymous) return;
    setShareStatus("sending");
    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          buildAnonymousTelemetry(envelope, navigator.userAgent),
        ),
      });
      if (!response.ok) throw new Error("Anonymous sharing failed");
      setShareStatus("shared");
    } catch {
      setShareStatus("error");
    }
  }

  async function openSavedRuns() {
    setShowHistory(true);
    setHistoryStatus("loading");
    try {
      setSavedRuns(await listLocalRuns());
      setHistoryStatus("ready");
    } catch {
      setHistoryStatus("error");
    }
  }

  async function downloadSavedRun(run: SavedRunSummary) {
    try {
      const payload = await getLocalRun(run.id);
      if (!payload) throw new Error("Could not find saved run");
      downloadJsonFile(
        payload,
        `stillgood-saved-check-${new Date(run.startedAt).getTime()}.json`,
      );
    } catch {
      setHistoryStatus("error");
    }
  }

  async function deleteSavedRuns() {
    if (!window.confirm("Delete every StillGood result saved in this browser?")) {
      return;
    }
    try {
      await clearLocalRuns();
      setSavedRuns([]);
      setHistoryStatus("ready");
    } catch {
      setHistoryStatus("error");
    }
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
    const actions: TimedSample["actions"] = [];
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
        presentationMs: Math.max(0, measured.durationMs - measured.workMs),
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

  async function measureImageEdit(seed: number) {
    const width = 960;
    const height = 540;
    const started = performance.now();
    const pixels = new Uint8ClampedArray(width * height * 4);
    let checksum = seed >>> 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const value = (index * 13 + seed * 17) & 255;
      pixels[index] = Math.min(255, value * 1.08 + 12);
      pixels[index + 1] = Math.min(255, ((value * 3) & 255) * 0.92 + 8);
      pixels[index + 2] = 255 - value;
      pixels[index + 3] = 255;
      checksum = (checksum + pixels[index] + pixels[index + 2]) >>> 0;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Image editing canvas unavailable");
    context.putImageData(new ImageData(pixels, width, height), 0, 0);
    context.filter = "contrast(1.08) saturate(1.12)";
    context.drawImage(canvas, 0, 0, width / 2, height / 2);
    const workMs = performance.now() - started;
    setVisualTick((value) => value + 1);
    await nextPaint();
    const durationMs = performance.now() - started;
    return {
      name: "Edit and resize a photo",
      durationMs,
      workMs,
      presentationMs: Math.max(0, durationMs - workMs),
      checksum,
    };
  }

  async function runMixedReserveStage({
    cadenceMs,
    reportedMemoryGB,
    memoryCapacityProbeCapped,
    storageTierIndex,
    onPhase,
  }: {
    cadenceMs: number;
    reportedMemoryGB: number | null;
    memoryCapacityProbeCapped: boolean;
    storageTierIndex: number;
    onPhase: (phase: ReservePhase) => void;
  }) {
    const mixedTiers = {
      browsing: browsingTiers[3],
      email: emailTiers[3],
      writing: writingTiers[3],
      spreadsheets: spreadsheetTiers[3],
    };
    const datasets = {
      browsing: buildBrowsingDataset(16100, mixedTiers.browsing.size),
      email: buildEmailDataset(16200, mixedTiers.email.size),
      writing: buildWritingDataset(16300, mixedTiers.writing.size),
      spreadsheets: buildSpreadsheetDataset(
        16400,
        mixedTiers.spreadsheets.size,
      ),
    };
    onPhase("component-preflight");
    let pdfDocument: PdfBenchmarkDocument | null = null;
    let pdfLoadingTask: { destroy(): Promise<void> } | null = null;
    let pdfBuild: "modern" | "legacy" | "legacy-safe" | null = null;
    let pdfFailureStage: MixedReserveLevel["pdfFailureStage"] = null;
    const pdfWorkerGlobal = globalThis as typeof globalThis & {
      pdfjsWorker?: unknown;
    };
    const previousPdfjsWorker = pdfWorkerGlobal.pdfjsWorker;
    const clearPdf = async () => {
      const loadingTask = pdfLoadingTask;
      pdfLoadingTask = null;
      pdfDocument = null;
      pdfBuild = null;
      await loadingTask?.destroy().catch(() => undefined);
    };
    const loadPdf = async (
      build: "modern" | "legacy",
      compatibilityMode: "default" | "safe" = "default",
    ) => {
      const pdfjs = build === "modern"
        ? await import("pdfjs-dist/build/pdf.mjs")
        : await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (compatibilityMode === "safe") {
        // PDF.js checks this documented worker handler before attempting a
        // dedicated worker. It gives Safari a real PDF.js main-thread path
        // when module-worker startup is the incompatible component.
        pdfWorkerGlobal.pdfjsWorker = await import(
          "pdfjs-dist/legacy/build/pdf.worker.mjs"
        );
      }
      pdfjs.GlobalWorkerOptions.workerSrc =
        build === "modern" ? pdfWorkerUrl : legacyPdfWorkerUrl;
      const loadingTask = pdfjs.getDocument({
        data: buildBenchmarkPdf({ pageCount: 32, linesPerPage: 40, seed: 16450 }),
        ...(compatibilityMode === "safe"
          ? {
              ownerDocument: document,
              isOffscreenCanvasSupported: false,
              isImageDecoderSupported: false,
              useWorkerFetch: false,
              useWasm: false,
            }
          : {}),
      });
      pdfLoadingTask = loadingTask;
      pdfDocument = (await loadingTask.promise) as PdfBenchmarkDocument;
      pdfBuild = compatibilityMode === "safe" ? "legacy-safe" : build;
    };
    try {
      pdfFailureStage = "modern-load";
      await loadPdf("modern");
    } catch {
      await clearPdf();
    }

    const executeReserve = async () => {

    const createAdvancedWorker = () => {
      try {
        return new Worker(
          new URL("../lib/advanced-benchmark-worker.ts", import.meta.url),
          { type: "module" },
        );
      } catch {
        // Some otherwise-capable browsers can reject a bundled module worker.
        // Advanced Wasm evidence is optional; the paired reserve check is not.
        return null;
      }
    };
    const createClassicWorker = () => {
      try {
        return new Worker("/benchmark-worker.js");
      } catch {
        return null;
      }
    };
    const runAdvancedWorker = (
      worker: Worker,
      level: "standard" | "extended",
      minimumDurationMs: number,
      suffix: string,
    ) => {
      const requestId = `advanced-${level}-${suffix}-${Date.now()}`;
      return requestWorkerResult<AdvancedWorkResult>(
        worker,
        {
          type: "advanced-web-work",
          requestId,
          level,
          minimumDurationMs,
        },
        "advanced-web-work-complete",
        Math.max(90000, minimumDurationMs + 45000),
      );
    };

    const measurePdfWork = async (seed: number) => {
      if (!pdfDocument) return null;
      const started = performance.now();
      const pageNumber = 1 + ((seed * 7) % pdfDocument.numPages);
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = document.createElement("canvas");
      try {
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item) => item.str ?? "").join(" ");
        const viewport = page.getViewport({ scale: 1.15 });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("PDF rendering canvas unavailable");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const workMs = performance.now() - started;
        setVisualTick((value) => value + 1);
        await nextPaint();
        const durationMs = performance.now() - started;
        return {
          name: "Open, search, and render a large PDF",
          durationMs,
          workMs,
          presentationMs: Math.max(0, durationMs - workMs),
          checksum:
            text.length +
            (text.includes("SECOND-LIFE CHECKPOINT") ? 8191 : 0) +
            pageNumber,
        };
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup?.();
      }
    };
    if (pdfDocument) pdfFailureStage = "modern-render";
    const initialPreflight = await preflightOptionalReserveComponents({
      image: () => measureImageEdit(16470),
      pdf: pdfDocument ? () => measurePdfWork(16480) : null,
    });
    const imageEditAvailable = initialPreflight.available.image;
    let pdfAvailable = initialPreflight.available.pdf;

    if (!pdfAvailable) {
      await clearPdf();
      try {
        pdfFailureStage = "legacy-load";
        await loadPdf("legacy");
        pdfFailureStage = "legacy-render";
        const legacyPreflight = await preflightOptionalReserveComponents({
          image: null,
          pdf: () => measurePdfWork(16490),
        });
        pdfAvailable = legacyPreflight.available.pdf;
      } catch {
        pdfAvailable = false;
      }
      if (!pdfAvailable) await clearPdf();
    }
    if (!pdfAvailable) {
      try {
        pdfFailureStage = "legacy-safe-load";
        await loadPdf("legacy", "safe");
        pdfFailureStage = "legacy-safe-render";
        const safePreflight = await preflightOptionalReserveComponents({
          image: null,
          pdf: () => measurePdfWork(16500),
        });
        pdfAvailable = safePreflight.available.pdf;
      } catch {
        pdfAvailable = false;
      }
      if (!pdfAvailable) await clearPdf();
    }
    if (pdfAvailable) pdfFailureStage = null;
    const runJourneys = async (cycles: number) => {
      const actions: TimedSample["actions"] = [];
      const imageDurations: number[] = [];
      const pdfDurations: number[] = [];
      for (let cycle = 0; cycle < cycles && !cancelledRef.current; cycle += 1) {
        const journeys = [
          await measureJourney("browsing", mixedTiers.browsing, 17000 + cycle, datasets.browsing),
          await measureJourney("email", mixedTiers.email, 17100 + cycle, datasets.email),
          await measureJourney("writing", mixedTiers.writing, 17200 + cycle, datasets.writing),
          await measureJourney("spreadsheets", mixedTiers.spreadsheets, 17300 + cycle, datasets.spreadsheets),
        ];
        journeys.forEach((journey) => actions.push(...journey.actions));
        if (imageEditAvailable) {
          const imageAction = await measureImageEdit(17400 + cycle);
          actions.push(imageAction);
          imageDurations.push(imageAction.durationMs);
        }
        if (pdfAvailable) {
          const pdfAction = await measurePdfWork(17500 + cycle);
          if (pdfAction) {
            actions.push(pdfAction);
            pdfDurations.push(pdfAction.durationMs);
          }
        }
        await sleep(90);
      }
      const durations = actions
        .map((action) => action.durationMs)
        .filter((value) => Number.isFinite(value));
      return {
        durations,
        p95Ms: percentile(durations, 0.95),
        worstMs: Math.max(...durations, 0),
        imageEditP95Ms: imageDurations.length
          ? percentile(imageDurations, 0.95)
          : null,
        pdfP95Ms: pdfDurations.length ? percentile(pdfDurations, 0.95) : null,
      };
    };

    setStatus("Preparing the same everyday actions for a fair comparison");
    await runJourneys(1); // untimed initialization of DOM, canvas, and PDF paths

    const runPressureLevel = async (
      id: "standard" | "extended",
    ): Promise<MixedReserveLevel> => {
      const extended = id === "extended";
      const workerCount = extended ? 4 : 2;
      const advancedDurationMs = extended ? 10000 : 7000;
      onPhase("advanced-baseline");
      setStatus(
        extended
          ? "Preparing the higher advanced-work baseline"
          : "Preparing advanced web work for a paired comparison",
      );
      const advancedBaselineWorker = createAdvancedWorker();
      if (advancedBaselineWorker) workersRef.current.push(advancedBaselineWorker);
      const advancedBaseline = advancedBaselineWorker
        ? await runAdvancedWorker(
            advancedBaselineWorker,
            id,
            advancedDurationMs,
            "baseline",
          ).catch(() => null)
        : null;
      advancedBaselineWorker?.terminate();
      if (advancedBaselineWorker) {
        workersRef.current = workersRef.current.filter(
          (worker) => worker !== advancedBaselineWorker,
        );
      }
      setStatus(
        extended
          ? "Measuring the higher level without overlapping work"
          : "Measuring the same actions without overlapping work",
      );
      onPhase("paired-baseline");
      const baselineResult = await runJourneys(2);
      const memoryPressureMB = extended
        ? memoryCapacityProbeCapped
          ? 384
          : reportedMemoryGB === 4
          ? 512
          : 768
        : memoryCapacityProbeCapped
          ? 256
          : reportedMemoryGB === 4
          ? 384
          : 512;
      const storagePressureMB = extended ? 128 : 64;
      onPhase("pressure-setup");
      const pressureWorkers = Array.from(
        { length: workerCount - 1 },
        (_, index) => {
          const worker = createClassicWorker();
          if (!worker) return null;
          worker.postMessage({
            type: "start",
            seed: 16500 + index + (extended ? 100 : 0),
            workUnits: extended ? 38 : 24,
            durationMs: 35000,
          });
          return worker;
        },
      ).filter((worker): worker is Worker => worker !== null);
      const advancedWorker = createAdvancedWorker();
      const memoryWorker = createClassicWorker();
      const storageWorker = createClassicWorker();
      workersRef.current.push(
        ...pressureWorkers,
        ...[advancedWorker, memoryWorker, storageWorker].filter(
          (worker): worker is Worker => worker !== null,
        ),
      );
      const intervals: number[] = [];
      let monitoring = true;
      let previousFrame = 0;
      let drawCount = 0;
      let monitorStart = 0;
      let monitorEnd = 0;
      const monitor = (timestamp: number) => {
        if (!monitoring) return;
        if (!monitorStart) monitorStart = timestamp;
        if (previousFrame) intervals.push(timestamp - previousFrame);
        previousFrame = timestamp;
        drawCount += 1;
        requestAnimationFrame(monitor);
      };
      const video = videoRef.current;
      let qualityBefore: VideoPlaybackQuality | undefined;
      if (video) {
        video.pause();
        video.loop = true;
        video.src = extended ? extendedVideoTiers[0].src : ordinaryVideoTiers[2].src;
        video.load();
        await Promise.race([
          new Promise<void>((resolve) =>
            video.addEventListener("loadeddata", () => resolve(), { once: true }),
          ),
          sleep(5000),
        ]);
        qualityBefore = video.getVideoPlaybackQuality?.();
        await video.play().catch(() => undefined);
      }
      if (memoryWorker) {
        try {
          await runMemoryTier(memoryWorker, memoryPressureMB, extended ? 1 : 0);
        } catch {
          // Other overlapping pressure remains valid when allocation is limited.
        }
      }
      await sleep(250);
      // Start persistent I/O immediately before the paired loaded journeys so
      // fast storage cannot finish while the memory working set is prepared.
      const storagePromise = storageWorker
        ? runOpfsStorageTier(
            storageWorker,
            storagePressureMB,
            extended ? 384 : 256,
            storageTierIndex + (extended ? 1 : 0),
          ).catch(() => null)
        : Promise.resolve(null);
      const advancedPromise = advancedWorker
        ? runAdvancedWorker(
            advancedWorker,
            id,
            advancedDurationMs,
            "loaded",
          ).catch(() => null)
        : Promise.resolve(null);
      setStatus(
        extended
          ? "Escalating to a higher reserve check"
          : "Comparing the same actions while several jobs overlap",
      );
      onPhase("paired-loaded");
      requestAnimationFrame(monitor);
      const started = performance.now();
      let loaded: Awaited<ReturnType<typeof runJourneys>>;
      let advancedLoaded: AdvancedWorkResult | null;
      try {
        [loaded, advancedLoaded] = await Promise.all([
          runJourneys(2),
          advancedPromise,
        ]);
      } finally {
        monitoring = false;
        monitorEnd = performance.now();
        video?.pause();
        pressureWorkers.forEach((worker) => {
          worker.postMessage({ type: "cancel" });
          worker.terminate();
        });
        advancedWorker?.terminate();
      }
      const storageMeasurement = await storagePromise;
      if (memoryWorker) {
        try {
          await requestWorkerResult(
            memoryWorker,
            { type: "memory-release", requestId: `mixed-release-${Date.now()}` },
            "memory-released",
            3000,
          );
        } catch {
          // Termination below releases the temporary working set.
        }
      }
      memoryWorker?.terminate();
      storageWorker?.terminate();
      workersRef.current = workersRef.current.filter(
        (worker) =>
          !pressureWorkers.includes(worker) &&
          worker !== advancedWorker &&
          worker !== memoryWorker &&
          worker !== storageWorker,
      );
      const frameSummary = summarizeGraphicsFrames({
        drawCount,
        intervals,
        displayCadenceMs: cadenceMs,
        elapsedMs:
          monitorStart > 0 ? Math.max(0, monitorEnd - monitorStart) : 0,
      });
      const qualityAfter = video?.getVideoPlaybackQuality?.();
      const videoFrames =
        qualityBefore && qualityAfter
          ? qualityAfter.totalVideoFrames - qualityBefore.totalVideoFrames
          : 0;
      const videoDropped =
        qualityBefore && qualityAfter
          ? qualityAfter.droppedVideoFrames - qualityBefore.droppedVideoFrames
          : 0;
      const advancedBaselineP95Ms =
        advancedBaseline?.available && advancedBaseline.summary
          ? advancedBaseline.summary.combined.p95Ms
          : null;
      const advancedLoadedP95Ms =
        advancedLoaded?.available && advancedLoaded.summary
          ? advancedLoaded.summary.combined.p95Ms
          : null;
      return {
        id,
        label: extended ? "Higher mixed pressure" : "Standard mixed pressure",
        durationMs: performance.now() - started,
        baselineP95Ms: Math.max(1, baselineResult.p95Ms),
        baselineWorstMs: baselineResult.worstMs,
        loadedP95Ms: loaded.p95Ms,
        loadedWorstMs: loaded.worstMs,
        slowdownRatio: loaded.p95Ms / Math.max(1, baselineResult.p95Ms),
        actionCount: loaded.durations.length,
        hitch250Ratio: loaded.durations.length
          ? loaded.durations.filter((value) => value > 250).length / loaded.durations.length
          : 1,
        hitch500Ratio: loaded.durations.length
          ? loaded.durations.filter((value) => value > 500).length / loaded.durations.length
          : 1,
        onTimeRatio: frameSummary.onTimeRatio,
        longFrameRatio: frameSummary.longFrameRatio,
        worstFrameMs: frameSummary.worstFrameMs,
        videoDroppedRatio: videoFrames > 0 ? videoDropped / videoFrames : null,
        imageEditP95Ms: loaded.imageEditP95Ms,
        imageEditAvailable,
        pdfP95Ms: loaded.pdfP95Ms,
        pdfAvailable,
        pdfBuild,
        pdfFailureStage,
        memoryPressureMB: memoryWorker ? memoryPressureMB : 0,
        storagePressureMB: storageMeasurement?.sizeMB ?? 0,
        workerCount: pressureWorkers.length + (advancedWorker ? 1 : 0),
        advancedAvailable:
          advancedBaselineP95Ms !== null && advancedLoadedP95Ms !== null,
        advancedBaselineP95Ms,
        advancedLoadedP95Ms,
        advancedWorstMs:
          advancedLoaded?.available && advancedLoaded.summary
            ? advancedLoaded.summary.combined.worstMs
            : null,
        advancedSlowdownRatio:
          advancedBaselineP95Ms !== null && advancedLoadedP95Ms !== null
            ? advancedLoadedP95Ms / Math.max(1, advancedBaselineP95Ms)
            : null,
        advancedBaselineStartupMs:
          advancedBaseline?.available && Number.isFinite(advancedBaseline.startupMs)
            ? advancedBaseline.startupMs ?? null
            : null,
        advancedStartupMs:
          advancedLoaded?.available && Number.isFinite(advancedLoaded.startupMs)
            ? advancedLoaded.startupMs ?? null
            : null,
        advancedCombinedMedianMs:
          advancedLoaded?.available && advancedLoaded.summary
            ? advancedLoaded.summary.combined.medianMs
            : null,
        advancedSqliteP95Ms:
          advancedLoaded?.available && advancedLoaded.summary
            ? advancedLoaded.summary.sqlite.p95Ms
            : null,
        advancedParserP95Ms:
          advancedLoaded?.available && advancedLoaded.summary
            ? advancedLoaded.summary.parser.p95Ms
            : null,
        advancedJsonP95Ms:
          advancedLoaded?.available && advancedLoaded.summary
            ? advancedLoaded.summary.json.p95Ms
            : null,
        advancedBaselineIterations:
          advancedBaseline?.available && Number.isFinite(advancedBaseline.iterations)
            ? advancedBaseline.iterations ?? null
            : null,
        advancedIterations:
          advancedLoaded?.available && Number.isFinite(advancedLoaded.iterations)
            ? advancedLoaded.iterations ?? null
            : null,
      };
    };

    const standard = await runPressureLevel("standard");
    const levels = [standard];
    if (shouldRunExtendedReserve(standard) && !cancelledRef.current) {
      setProgress(99.2);
      levels.push(await runPressureLevel("extended"));
    }
    const finalLevel = levels.at(-1) ?? standard;
    const output = {
      result: {
        ...finalLevel,
        tested: true,
        paired: true,
        fallbackUsed:
          levels.some(
            (level) =>
              !level.advancedAvailable ||
              !level.imageEditAvailable ||
              !level.pdfAvailable ||
              level.pdfBuild !== "modern",
          ),
        durationMs: levels.reduce((sum, level) => sum + level.durationMs, 0),
        levels,
      } satisfies MixedReserveResult,
    };
    return output;
    };

    let completed = false;
    try {
      const output = await executeReserve();
      completed = true;
      return output;
    } finally {
      if (completed) onPhase("cleanup");
      await clearPdf();
      if (previousPdfjsWorker === undefined) {
        delete pdfWorkerGlobal.pdfjsWorker;
      } else {
        pdfWorkerGlobal.pdfjsWorker = previousPdfjsWorker;
      }
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      if (completed) onPhase("complete");
    }
  }

  async function measureRecovery() {
    const recoveryStart = performance.now();
    let stable = 0;
    while (stable < 5 && performance.now() - recoveryStart < 12000) {
      const probe = performance.now();
      await sleep(50);
      const lag = performance.now() - probe - 50;
      stable = lag < 20 ? stable + 1 : 0;
    }
    return performance.now() - recoveryStart;
  }

  async function appendBoundaryConfirmationSamples(
    stageId: "browsing" | "email" | "writing" | "spreadsheets" | "multitasking",
    measuredTiers: LatencyTierResult[],
    tierDefinitions: Tier[],
    seedBase: number,
  ) {
    const measuredTier = [...measuredTiers].reverse().find(
      (candidate) =>
        !candidate.earlyStopped &&
        !["headroom", "limit", "reserve"].includes(candidate.id) &&
        candidate.samples.some((sample) => sample.actions.length > 0),
    );
    const tier = measuredTier
      ? tierDefinitions.find((candidate) => candidate.id === measuredTier.id)
      : null;
    if (!measuredTier || !tier) return null;

    const dataset =
      stageId === "browsing"
        ? buildBrowsingDataset(seedBase, tier.size)
        : stageId === "writing"
          ? buildWritingDataset(seedBase, tier.size)
          : stageId === "spreadsheets"
            ? buildSpreadsheetDataset(seedBase, tier.size)
            : buildEmailDataset(seedBase, tier.size);
    const newSamples: TimedSample[] = [];
    const multitaskLevel = Math.max(
      0,
      workloadTiers.findIndex((candidate) => candidate.id === tier.id) - 1,
    );

    if (stageId === "multitasking") {
      const maxWorkers = Math.max(
        1,
        Math.min(4, (navigator.hardwareConcurrency || 2) - 1),
      );
      const workerCount = Math.min(maxWorkers, multitaskLevel + 1);
      workersRef.current = Array.from({ length: workerCount }, (_, index) => {
        const worker = new Worker("/benchmark-worker.js");
        worker.postMessage({
          type: "start",
          seed: seedBase + index,
          workUnits: 4 + multitaskLevel * 5,
          durationMs: 12000,
        });
        return worker;
      });
      await sleep(350);
    }

    try {
      await measureJourney(stageId, tier, seedBase + 20, dataset);
      for (let repetition = 0; repetition < 2; repetition += 1) {
        newSamples.push(
          await measureJourney(
            stageId,
            tier,
            seedBase + 30 + repetition,
            dataset,
          ),
        );
        await sleep(stageId === "multitasking" ? 250 : 90);
      }
      measuredTier.samples.push(...newSamples);
      return {
        category: stageId,
        tier: measuredTier.id,
        addedSamples: newSamples.length,
      };
    } finally {
      if (stageId === "multitasking") {
        workersRef.current.forEach((worker) => {
          worker.postMessage({ type: "cancel" });
          worker.terminate();
        });
        workersRef.current = [];
      }
    }
  }

  async function runGraphicsTier(
    id: string,
    label: string,
    complexity: number,
    cadenceMs: number,
    durationMs = 1800,
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
        expectedFrameCount: 0,
        displayCadenceMs: cadenceMs,
        evaluationCadenceMs: Math.max(1000 / 60, cadenceMs),
        valid: false,
      };
    }

    const intervals: number[] = [];
    const evaluationCadenceMs = Math.max(1000 / 60, cadenceMs);
    const schedulingToleranceMs = Math.min(cadenceMs * 0.25, 2);
    let previousDraw = 0;
    let nextDraw = 0;
    let drawCount = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const draw = (timestamp: number) => {
        if (!nextDraw) nextDraw = timestamp;
        if (timestamp >= nextDraw - schedulingToleranceMs) {
          if (previousDraw) intervals.push(timestamp - previousDraw);
          previousDraw = timestamp;
          drawCount += 1;
          context.fillStyle = "#162033";
          context.fillRect(0, 0, canvas.width, canvas.height);
          for (let index = 0; index < complexity; index += 1) {
            const x = (index * 47 + timestamp * 0.08) % canvas.width;
            const y = (index * 83 + timestamp * 0.04) % canvas.height;
            context.fillStyle =
              index % 3 === 0
                ? "#6636b8"
                : index % 3 === 1
                  ? "#9a7bd2"
                  : "#c8b9e4";
            context.beginPath();
            context.arc(x, y, 2 + (index % 7), 0, Math.PI * 2);
            context.fill();
          }
          nextDraw += evaluationCadenceMs;
          while (nextDraw < timestamp - schedulingToleranceMs) {
            nextDraw += evaluationCadenceMs;
          }
        }
        if (
          performance.now() - start < durationMs &&
          !cancelledRef.current
        ) {
          requestAnimationFrame(draw);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(draw);
    });
    const frameSummary = summarizeGraphicsFrames({
      drawCount,
      intervals,
      displayCadenceMs: cadenceMs,
      elapsedMs: performance.now() - start,
    });
    return {
      id,
      label,
      complexity,
      ...frameSummary,
      frameCount: drawCount,
      valid: true,
    };
  }

  async function runVideoTier(
    tier: VideoTier,
    capability: VideoCapability = {
      supported: null,
      smooth: null,
      powerEfficient: null,
    },
  ): Promise<VideoTierResult> {
    const video = videoRef.current;
    if (!video)
      return {
        ...tier,
        droppedRatio: 1,
        stalls: 1,
        stallDurationMs: 0,
        longestStallMs: 0,
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
        stallDurationMs: 0,
        longestStallMs: 0,
        completed: false,
        totalFrames: 0,
        valid: false,
        measurementSource: "unavailable",
        mediaAdvancedMs: 0,
      };

    let stalls = 0;
    let stallDurationMs = 0;
    let longestStallMs = 0;
    let waitingStartedAt: number | null = null;
    let playbackStarted = false;
    const finishWaitingPeriod = () => {
      if (waitingStartedAt == null) return;
      const duration = Math.max(0, performance.now() - waitingStartedAt);
      stallDurationMs += duration;
      longestStallMs = Math.max(longestStallMs, duration);
      waitingStartedAt = null;
    };
    const onWaiting = () => {
      if (playbackStarted && waitingStartedAt == null) {
        stalls += 1;
        waitingStartedAt = performance.now();
      }
    };
    const onPlaying = () => {
      if (playbackStarted) finishWaitingPeriod();
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
    finishWaitingPeriod();
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
      frameRate: tier.frameRate,
      bitrate: tier.bitrate,
      ...("headroom" in tier ? { headroom: tier.headroom } : {}),
      capabilitySupported: capability.supported,
      capabilitySmooth: capability.smooth,
      capabilityPowerEfficient: capability.powerEfficient,
      droppedRatio:
        qualityFrames > 0
          ? dropped / qualityFrames
          : callbackFrames > 0
            ? 0
            : 1,
      stalls,
      stallDurationMs,
      longestStallMs,
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
    setSaveStatus("idle");
    setShareStatus("idle");
    setResult(null);
    setProgress(0);
    setStageIndex(0);
    setReserveStageActive(false);
    setPhase("prepare");
    setStatus("Caching the local workloads");
    const startedAt = new Date().toISOString();
    const testStart = performance.now();

    await Promise.allSettled(
      ordinaryVideoTiers.map((tier) =>
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

    setStatus("Checking whether the computer has settled");
    const firstBaseline = await measureIdleBaseline();
    let finalBaseline = firstBaseline;
    let warmupExtended = false;
    if (firstBaseline.unsettled) {
      warmupExtended = true;
      setStatus("Background work detected · allowing a little more time");
      await sleep(800);
      finalBaseline = await measureIdleBaseline();
    }

    const longTasks: number[] = [];
    const longFrames: number[] = [];
    const observers: PerformanceObserver[] = [];
    const supportedPerformanceEntries = new Set(
      PerformanceObserver.supportedEntryTypes ?? [],
    );
    const longTaskSupported = supportedPerformanceEntries.has("longtask");
    const longAnimationFrameSupported = supportedPerformanceEntries.has(
      "long-animation-frame",
    );
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
    const measurementStart = performance.now();

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
        15,
      );
      if (cancelledRef.current) return;

      setStageIndex(1);
      await nextPaint();
      const emailResults = await runLatencySection("email", emailTiers, 15, 27);
      if (cancelledRef.current) return;

      setStageIndex(2);
      await nextPaint();
      const writingResults = await runLatencySection(
        "writing",
        writingTiers,
        27,
        39,
      );
      if (cancelledRef.current) return;

      setStageIndex(3);
      await nextPaint();
      const spreadsheetResults = await runLatencySection(
        "spreadsheets",
        spreadsheetTiers,
        39,
        50,
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
      await runGraphicsTier("warmup", "Warm-up", 240, cadenceMs, 450);
      for (let index = 0; index < graphicsLevels.length; index += 1) {
        const [id, label, complexity] = graphicsLevels[index];
        graphicsTiers.push(
          await runGraphicsTier(id, label, complexity, cadenceMs),
        );
        setProgress(50 + ((index + 1) / graphicsLevels.length) * 9);
      }
      if (cancelledRef.current) return;

      setStageIndex(5);
      await nextPaint();
      const measuredVideoTiers: VideoTierResult[] = [];
      for (let index = 0; index < ordinaryVideoTiers.length; index += 1) {
        setStatus(`Checking ${ordinaryVideoTiers[index].label} video playback`);
        const measured = await runVideoTier(ordinaryVideoTiers[index]);
        measuredVideoTiers.push(measured);
        setProgress(59 + ((index + 1) / ordinaryVideoTiers.length) * 6);
        if (
          !measured.valid ||
          measured.droppedRatio > 0.15 ||
          measured.stalls > 2
        ) {
          for (
            let remaining = index + 1;
            remaining < ordinaryVideoTiers.length;
            remaining += 1
          ) {
            measuredVideoTiers.push({
              ...ordinaryVideoTiers[remaining],
              droppedRatio: 1,
              stalls: 1,
              stallDurationMs: 0,
              longestStallMs: 0,
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
      for (let index = 0; index < ordinaryVideoTiers.length - 1; index += 1) {
        if (!needsVideoConfirmation(measuredVideoTiers, index)) continue;
        const tier = ordinaryVideoTiers[index];
        setStatus(`Double-checking the ${tier.label} playback result`);
        const attempts = [measuredVideoTiers[index]];
        attempts.push(await runVideoTier(tier));
        attempts.push(await runVideoTier(tier));
        measuredVideoTiers[index] = consolidateVideoTierAttempts(attempts);
      }
      const base1080p = measuredVideoTiers.find((tier) => tier.id === "1080p");
      const extendedEligible = shouldAttemptExtendedVideo({
        latencyGroups: [
          browsingResults,
          emailResults,
          writingResults,
          spreadsheetResults,
        ],
        graphicsTiers,
        baseVideoTier: base1080p,
      });

      if (!extendedEligible) {
        for (const tier of extendedVideoTiers) {
          measuredVideoTiers.push(
            skippedVideoTier(
              tier,
              "Everyday workload results did not justify an extended media check.",
            ),
          );
        }
        setStatus("Higher-resolution video was not needed for this result");
        setProgress(68);
      } else {
        const firstExtendedTiers = extendedVideoTiers.slice(0, 2);
        for (let index = 0; index < firstExtendedTiers.length; index += 1) {
          const tier = firstExtendedTiers[index];
          setStatus(`Checking optional ${tier.label} video headroom`);
          const capability = await videoCapabilityFor(tier);
          if (capability.supported === false) {
            measuredVideoTiers.push(
              skippedVideoTier(
                tier,
                "The browser reported that this video format is unsupported.",
                capability,
              ),
            );
          } else {
            try {
              const response = await fetch(tier.src, { cache: "force-cache" });
              if (!response.ok) throw new Error("video unavailable");
              await response.arrayBuffer();
              measuredVideoTiers.push(await runVideoTier(tier, capability));
            } catch {
              measuredVideoTiers.push(
                skippedVideoTier(
                  tier,
                  "The optional local video fixture was unavailable.",
                  capability,
                ),
              );
            }
          }
          setProgress(66 + index);
        }

        const ultraHdTier = extendedVideoTiers[2];
        if (!shouldAttempt4k(measuredVideoTiers)) {
          measuredVideoTiers.push(
            skippedVideoTier(
              ultraHdTier,
              "The preceding high-resolution checks found the practical ceiling.",
            ),
          );
        } else {
          setStatus("Checking optional 4K video headroom");
          const capability = await videoCapabilityFor(ultraHdTier);
          if (capability.supported === false) {
            measuredVideoTiers.push(
              skippedVideoTier(
                ultraHdTier,
                "The browser reported that 4K H.264 is unsupported.",
                capability,
              ),
            );
          } else {
            try {
              const response = await fetch(ultraHdTier.src, {
                cache: "force-cache",
              });
              if (!response.ok) throw new Error("video unavailable");
              await response.arrayBuffer();
              measuredVideoTiers.push(
                await runVideoTier(ultraHdTier, capability),
              );
            } catch {
              measuredVideoTiers.push(
                skippedVideoTier(
                  ultraHdTier,
                  "The optional local 4K fixture was unavailable.",
                  capability,
                ),
              );
            }
          }
        }
        setProgress(68);
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
        setProgress(68 + ((level + 1) / 4) * 15);
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
      const memoryTiers: MemoryTierResult[] = [];
      let memorySupported = true;
      const deviceMemoryValue = (
        navigator as Navigator & { deviceMemory?: number }
      ).deviceMemory;
      const reportedMemoryGB = typeof deviceMemoryValue === "number"
        ? deviceMemoryValue <= 2
          ? 2
          : deviceMemoryValue <= 4
            ? 4
            : 8
        : null;
      const memoryPlan = planMemoryPressureLevels({
        reportedMemoryGB,
        formFactor: detectFormFactor(),
      });
      const memoryCapacityProbeCapped = memoryPlan.capacityProbeCapped;
      const testVideo = videoRef.current;
      if (testVideo) {
        testVideo.pause();
        testVideo.removeAttribute("src");
        testVideo.load();
        await nextPaint();
      }
      const memoryWorker = new Worker("/benchmark-worker.js");
      workersRef.current.push(memoryWorker);
      try {
        await requestWorkerResult(
          memoryWorker,
          { type: "memory-initialize", requestId: `memory-init-${Date.now()}` },
          "memory-initialized",
          3000,
        );
        const memoryLevels = memoryPlan.levels;
        let baselineProbeP95Ms: number | null = null;
        for (const [index, targetMB] of memoryLevels.entries()) {
          setStatus(`Keeping ${targetMB} MB active while checking responsiveness`);
          let measured: MemoryTierResult;
          try {
            measured = await runMemoryTier(memoryWorker, targetMB, index);
          } catch {
            if (memoryTiers.length === 0) memorySupported = false;
            break;
          }
          memoryTiers.push(measured);
          baselineProbeP95Ms ??= Math.max(1, measured.probeP95Ms);
          setProgress(83 + ((index + 1) / memoryLevels.length) * 8);
          if (
            measured.probeP95Ms > Math.max(120, baselineProbeP95Ms * 4) ||
            measured.probeWorstMs > 750 ||
            measured.gcWorstRoundMs > 800 ||
            measured.copyRoundTripMs > 8000
          ) {
            break;
          }
        }
      } catch {
        memorySupported = false;
      } finally {
        try {
          await requestWorkerResult(
            memoryWorker,
            {
              type: "memory-release",
              requestId: `release-${Date.now()}`,
            },
            "memory-released",
            3000,
          );
        } catch {
          // Terminating the worker below also releases retained memory.
        }
        memoryWorker.terminate();
        workersRef.current = workersRef.current.filter(
          (worker) => worker !== memoryWorker,
        );
      }
      if (cancelledRef.current) return;

      setStageIndex(8);
      await nextPaint();
      const storageTiers: StorageTierResult[] = [];
      const strictStorageTiers: StrictStorageTierResult[] = [];
      const opfsStorageTiers: OpfsStorageTierResult[] = [];
      let storageAvailable = true;
      let strictStorageAvailable = true;
      let database: IDBDatabase | null = null;
      try {
        database = await openStorageDatabase();
        for (const [index, size] of [1, 8, 32].entries()) {
          setStatus("Saving and reopening ordinary browser data");
          storageTiers.push(await runStorageTier(database, size, index));
          setProgress(91 + ((index + 1) / 3) * 2);
        }
        for (
          const [index, transactionCount] of [8, 24, 64].entries()
        ) {
          setStatus("Committing small changes to persistent browser storage");
          try {
            strictStorageTiers.push(
              await runStrictStorageTier(
                database,
                transactionCount,
                16,
                index,
              ),
            );
          } catch {
            strictStorageAvailable = false;
            break;
          }
          setProgress(93 + ((index + 1) / 3) * 2);
        }
      } catch {
        storageAvailable = false;
        strictStorageAvailable = false;
      } finally {
        database?.close();
        indexedDB.deleteDatabase("stillgood-thorough-check");
      }

      const opfsWorker = new Worker("/benchmark-worker.js");
      workersRef.current.push(opfsWorker);
      try {
        const opfsLevels =
          detectFormFactor() === "mobile"
            ? [
                { sizeMB: 8, randomReads: 96 },
                { sizeMB: 32, randomReads: 192 },
                { sizeMB: 64, randomReads: 320 },
              ]
            : [
                { sizeMB: 16, randomReads: 128 },
                { sizeMB: 64, randomReads: 256 },
                { sizeMB: 128, randomReads: 384 },
              ];
        for (const [index, level] of opfsLevels.entries()) {
          setStatus("Flushing and reopening a persistent local browser file");
          const measured = await runOpfsStorageTier(
            opfsWorker,
            level.sizeMB,
            level.randomReads,
            index,
          );
          opfsStorageTiers.push(measured);
          setProgress(95 + ((index + 1) / opfsLevels.length) * 3);
          if (
            !measured.available ||
            measured.flushWorstMs > 5000 ||
            measured.foregroundWorstMs > 1000
          )
            break;
        }
      } catch (error) {
        opfsStorageTiers.push({
          id: "persistent-file-unavailable",
          label: "Persistent file",
          sizeMB: 0,
          randomReads: 0,
          writeMs: 0,
          flushMs: 0,
          reopenMs: 0,
          randomReadMs: 0,
          flushP95Ms: 0,
          flushWorstMs: 0,
          coldWriteMs: null,
          coldFlushMs: null,
          coldReopenMs: null,
          coldRandomReadMs: null,
          foregroundP95Ms: 0,
          foregroundWorstMs: 0,
          samples: [],
          verified: false,
          available: false,
          error:
            error instanceof Error
              ? error.message
              : "Persistent file timing unavailable",
        });
      } finally {
        opfsWorker.terminate();
        workersRef.current = workersRef.current.filter(
          (worker) => worker !== opfsWorker,
        );
      }

      setStatus("Measuring recovery and run stability");
      let recoveryMs = await measureRecovery();
      const formFactor = detectFormFactor();
      let mixedReserve: MixedReserveResult | null = null;
      const buildSummaryMetrics = (reserveEvaluationComplete = false) => ({
        browserFamily: browserFamily(),
        browsingTiers: browsingResults,
        emailTiers: emailResults,
        writingTiers: writingResults,
        spreadsheetTiers: spreadsheetResults,
        graphicsTiers,
        videoTiers: measuredVideoTiers,
        multitaskTiers,
        memoryTiers,
        memorySupported,
        memoryCapacityProbeCapped,
        reportedMemoryGB,
        storageTiers,
        strictStorageTiers,
        opfsStorageTiers,
        storageAvailable,
        strictStorageAvailable,
        recoveryMs,
        longTaskCount: longTasks.length,
        longAnimationFrameCount: longFrames.length,
        longTaskDurations: longTasks,
        longAnimationFrameDurations: longFrames,
        measuredActiveMs: performance.now() - measurementStart,
        longTaskSupported,
        longAnimationFrameSupported,
        interruptionCount,
        baselineUnsettled: finalBaseline.unsettled,
        mixedReserve,
        reserveEvaluationComplete,
      });
      let summary = summarizeThoroughRun(buildSummaryMetrics());
      const upperReservePlan = planUpperReserve(summary);
      const upperReserveRun = {
        triggered: upperReservePlan.needed,
        reason: upperReservePlan.reason,
        status: upperReservePlan.needed ? "started" : "not-qualified",
        phase: "not-started" as ReservePhase,
        failureCode: null as string | null,
        scoreBefore: summary.score,
        gradeBefore: summary.grade,
        scoreAfter: summary.score,
        gradeAfter: summary.grade,
        elapsedMs: 0,
      };
      if (upperReservePlan.needed) {
        const reserveStart = performance.now();
        setReserveStageActive(true);
        setStageIndex(stages.length);
        setProgress(98);
        setStatus("Everyday check complete · preparing overlapping work");
        await nextPaint();
        try {
          const measured = await runMixedReserveStage({
            cadenceMs,
            reportedMemoryGB,
            memoryCapacityProbeCapped,
            storageTierIndex: opfsStorageTiers.length,
            onPhase: (phase) => {
              upperReserveRun.phase = phase;
            },
          });
          mixedReserve = measured.result;
          upperReserveRun.status = measured.result.fallbackUsed
            ? "completed-with-fallback"
            : "completed";
        } catch (error) {
          mixedReserve = null;
          upperReserveRun.status = "failed";
          const message = error instanceof Error ? error.message : String(error);
          upperReserveRun.failureCode = /worker/i.test(message)
            ? "worker-runtime"
            : /timed out/i.test(message)
              ? "timeout"
              : /storage|file|opfs/i.test(message)
                ? "storage-runtime"
                : "unknown-runtime";
        }
        if (cancelledRef.current) return;
        setStatus("Checking how quickly normal response returns");
        recoveryMs = await measureRecovery();
        upperReserveRun.elapsedMs = performance.now() - reserveStart;
      }
      summary = summarizeThoroughRun(buildSummaryMetrics(true));
      upperReserveRun.scoreAfter = summary.score;
      upperReserveRun.gradeAfter = summary.grade;
      const initialBoundarySummary = {
        score: summary.score,
        grade: summary.grade,
      };
      const boundaryPlan = planBoundaryConfirmation(summary);
      const boundaryConfirmationRuns: Array<{
        category: string;
        tier: string;
        addedSamples: number;
      }> = [];
      if (boundaryPlan.needed) {
        setStatus("Confirming a result near a scoring boundary");
        setProgress(99);
        await nextPaint();
        const confirmationSources = {
          browsing: {
            measured: browsingResults,
            definitions: browsingTiers,
          },
          email: { measured: emailResults, definitions: emailTiers },
          writing: { measured: writingResults, definitions: writingTiers },
          spreadsheets: {
            measured: spreadsheetResults,
            definitions: spreadsheetTiers,
          },
          multitasking: {
            measured: multitaskTiers,
            definitions: workloadTiers,
          },
        };
        for (const [index, categoryId] of boundaryPlan.categories.entries()) {
          if (cancelledRef.current) return;
          const category = categoryId as keyof typeof confirmationSources;
          const source = confirmationSources[category];
          setStatus(`Double-checking ${stages.find((item) => item.id === category)?.name.toLowerCase() ?? category}`);
          const confirmed = await appendBoundaryConfirmationSamples(
            category,
            source.measured,
            source.definitions,
            9100 + index * 200,
          );
          if (confirmed) boundaryConfirmationRuns.push(confirmed);
        }
        summary = summarizeThoroughRun(buildSummaryMetrics(true));
      }

      const boundaryConfirmation = {
        triggered: boundaryPlan.needed,
        margin: boundaryPlan.margin,
        reason: boundaryPlan.reason,
        gradeBoundary: boundaryPlan.gradeBoundary,
        capabilityBoundaries: boundaryPlan.capabilityBoundaries,
        plannedCategories: boundaryPlan.categories,
        runs: boundaryConfirmationRuns,
        scoreBefore: initialBoundarySummary.score,
        gradeBefore: initialBoundarySummary.grade,
        scoreAfter: summary.score,
        gradeAfter: summary.grade,
      };
      const completedBrowser = browserLabel();
      const completedPlatform = navigator.platform || "Platform not reported";
      const completedProcessors = navigator.hardwareConcurrency || null;
      const completedProfileVersion = "6.24.2-capability-grade-bands";
      const shadowScoring = summarizeShadowV7(buildSummaryMetrics(true));
      const previousLocalRuns = await listLocalRuns().catch(() => savedRuns);
      const recentRunRange = summarizeRecentRunRange(
        {
          score: summary.score,
          browser: completedBrowser,
          platform: completedPlatform,
          logicalProcessors: completedProcessors,
          profileVersion: completedProfileVersion,
        },
        previousLocalRuns,
      );
      const completedResult: ThoroughResult = {
        ...summary,
        browser: completedBrowser,
        platform: completedPlatform,
        formFactor,
        powerSource: "not-reported",
        logicalProcessors: completedProcessors,
        cadenceMs,
        startedAt,
        elapsedMs: performance.now() - testStart,
        profileVersion: completedProfileVersion,
        shadowScoring,
        recentRunRange,
        boundaryConfirmation,
        raw: {
          compatibilityAdapters: compatibilityAdapterProfile,
          browserEvidencePolicy: browserEvidenceProfile,
          preflightBaseline: {
            first: firstBaseline,
            final: finalBaseline,
            warmupExtended,
          },
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
          upperReservePolicy: {
            minimumScore: upperReservePlan.minimumScore,
            minimumScore1000: upperReservePlan.minimumScore1000,
            minimumHeadroom: upperReservePlan.minimumHeadroom,
            minimumCoreScore: upperReservePlan.minimumCoreScore,
            minimumCoreScore1000: upperReservePlan.minimumCoreScore1000,
            candidateScore1000: upperReservePlan.candidateScore1000 ?? null,
            mode: "paired-mixed-workload",
            baselineAndLoadedUseIdenticalJourneys: true,
            advancedBaselineAndLoadedUseMatchedWindows: true,
            advancedStandardWindowMs: 7000,
            advancedExtendedWindowMs: 10000,
            standardPressureWeight: 0.65,
            extendedPressureWeight: 0.35,
            extendedPressureRan: (mixedReserve?.levels.length ?? 0) > 1,
            memoryPressureMB: mixedReserve?.memoryPressureMB ?? null,
            persistentSaveMB: mixedReserve?.storagePressureMB ?? null,
          },
          upperReserveRun,
          mixedReserve,
          browsingTiers: browsingResults,
          emailTiers: emailResults,
          writingTiers: writingResults,
          spreadsheetTiers: spreadsheetResults,
          graphicsTiers,
          videoTiers: measuredVideoTiers,
          multitaskTiers,
          memoryTiers,
          memorySupported,
          memoryCapacityProbeCapped,
          memoryPressurePlan: {
            levelsMB: memoryPlan.levels,
            reason: memoryPlan.reason,
          },
          reportedMemoryGB,
          storageTiers,
          strictStorageTiers,
          opfsStorageTiers,
          storageAvailable,
          strictStorageAvailable,
          longTaskDurations: longTasks,
          longAnimationFrameDurations: longFrames,
          longTaskSupported,
          longAnimationFrameSupported,
          measuredActiveMs: performance.now() - measurementStart,
          boundaryConfirmation,
        },
      };
      setResult(completedResult);
      setProgress(100);
      setPhase("result");
      void saveResultAutomatically(completedResult);
    } finally {
      workersRef.current.forEach((worker) => worker.terminate());
      workersRef.current = [];
      observers.forEach((observer) => observer.disconnect());
      document.removeEventListener("visibilitychange", onVisibility);
    }
  }

  function downloadResult() {
    if (!result) return;
    downloadJsonFile(
      resultEnvelope(result),
      `stillgood-everyday-check-${Date.now()}.json`,
    );
  }

  if (phase === "home") {
    return (
      <>
      <main className="simple-shell">
        <header className="simple-header">
          <a className="simple-brand" href="#" aria-label="StillGood home">
            <span>S</span> StillGood
          </a>
          <div className="header-actions">
            <a className="header-link" href="/methodology">
              Methodology
            </a>
            <a
              className="header-link source-header-link"
              href="https://github.com/PerceptLabs/stillgood"
              target="_blank"
              rel="noreferrer"
            >
              Source code
            </a>
            <button className="header-link" onClick={openSavedRuns}>
              Saved runs
            </button>
          </div>
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
            One automatic test. A clear answer. Usually two to four minutes;
            exceptional results receive a short extra reserve check.
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
            Chromium is the reference browser; Firefox support is experimental.
          </p>
          <label className="sharing-choice">
            <input
              type="checkbox"
              checked={shareAnonymous}
              onChange={(event) =>
                updateAnonymousSharing(event.currentTarget.checked)
              }
            />
            <span>
              <strong>Help improve StillGood</strong>
              Share anonymous benchmark measurements after each completed test.
              This is off unless you choose it. <a href="/privacy">Privacy details</a>
            </span>
          </label>
        </details>
        <footer className="simple-footer">
          <span>Private by design · local workloads · saved on this device</span>
          <span>
            <a href="/methodology">Methodology</a> · <a href="/privacy">Privacy</a> ·{" "}
            <a
              href="https://github.com/PerceptLabs/stillgood"
              target="_blank"
              rel="noreferrer"
            >
              View source on GitHub
            </a>
          </span>
        </footer>
      </main>
      {showHistory && (
        <SavedRunsDialog
          runs={savedRuns}
          status={historyStatus}
          onClose={() => setShowHistory(false)}
          onDownload={downloadSavedRun}
          onDeleteAll={deleteSavedRuns}
        />
      )}
      </>
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
            <span>of {visibleStages.length}</span>
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
            status={status}
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
          {visibleStages.map((item, index) => (
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
  const advancedWebWork = result.upperReserve.components.find(
    (component) => component.id === "advanced-web-work",
  );
  const advancedWebWorkLabel = advancedWebWork
    ? advancedWebWork.score >= 86
      ? "Comfortable"
      : advancedWebWork.score >= 76
        ? "Practical"
        : advancedWebWork.score >= 66
          ? "Best kept light"
          : "Slowed under pressure"
    : null;
  const categoryCards = [
    ["Web browsing", result.browsing],
    ["Email and webmail", result.email],
    ["Documents", result.writing],
    ["Spreadsheets", result.spreadsheets],
    ["Multitasking", result.multitasking],
    ["Scrolling and visuals", result.graphics],
    ["Video playback", result.video],
    ["Responsiveness under memory pressure", result.memory],
    ["Persistent saves", result.storage],
  ] as const;
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
        <div className="header-actions">
          <a className="header-link" href="/methodology">
            Methodology
          </a>
          <a
            className="header-link source-header-link"
            href="https://github.com/PerceptLabs/stillgood"
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
          <button className="header-link" onClick={openSavedRuns}>
            Saved runs
          </button>
        </div>
      </header>
      <section className="clear-answer">
        <div
          className="result-score"
          aria-label={`Score ${result.score} out of 100, grade ${result.grade}`}
        >
          <strong>{result.score}</strong>
          <span>{result.grade} grade · out of 100</span>
        </div>
        <div className="answer-copy">
          {(result.ceilingReached ||
            result.formFactor === "mobile" ||
            result.upperReserve.tested) && (
            <div className="answer-meta">
              {result.ceilingReached && <span>Above the current test ceiling</span>}
              {result.formFactor === "mobile" && <span>Mobile result</span>}
              {result.upperReserve.tested && <span>Heavy-work reserve checked</span>}
            </div>
          )}
          <h1>{guide.headline}</h1>
          <p className="answer-summary">{guide.topSummary}</p>
          <p className="result-stability">
            <strong>Run quality: {guide.runQuality.label}.</strong>{" "}
            {result.boundaryConfirmation?.triggered &&
              "A borderline result was confirmed with extra measurements. "}
            {guide.variation.message}
          </p>
          {result.recentRunRange?.available && (
            <p className={`result-stability${result.recentRunRange.variable ? " result-variable" : ""}`}>
              <strong>
                {result.recentRunRange.variable
                  ? "Variable between runs."
                  : "Repeatable result."}
              </strong>{" "}
              {result.recentRunRange.message}
            </p>
          )}
        </div>
      </section>
      <section
        className={`result-dimensions${guide.consistency.level === "steady" ? " result-dimensions-single" : ""}`}
        aria-label="Performance context"
      >
        <article>
          <span>Room for heavier work</span>
          <strong>{guide.reserve.label}</strong>
          <p>{guide.reserve.summary}</p>
        </article>
        {guide.consistency.level !== "steady" && (
          <article>
            <span>Consistency</span>
            <strong>{guide.consistency.label}</strong>
            <p>{guide.consistency.summary}</p>
          </article>
        )}
      </section>
      <section className="capability-overview" aria-label="Everyday capabilities">
        {guide.capabilityCards.map(
          (card: { id: string; title: string; rating: string; detail: string }) => (
            <article key={card.id}>
              <span>{card.title}</span>
              <strong>{card.rating}</strong>
              <p>{card.detail}</p>
            </article>
          ),
        )}
      </section>
      <PerformanceProfile profile={guide.performanceProfile} />
      <section className="guide-invite">
        <div>
          <p className="kicker">Full report</p>
          <h2>See where the result came from</h2>
          <p>
            Review every test, practical recommendations, and the browser and
            device context behind this result.
          </p>
        </div>
        <button className="guide-action" onClick={() => setShowGuide(true)}>
          Open full report
          <span aria-hidden="true">↗</span>
        </button>
      </section>
      <details className="result-breakdown">
        <summary>See all {categoryCards.length} test results</summary>
        <section className="check-results check-results-six">
          {categoryCards.map(([name, category]) => (
            <article key={name}>
              <div>
                <strong>{name}</strong>
                <span>
                  {name === "Persistent saves" &&
                  (result.storage.largeFlushMs ?? 0) >= 250
                    ? guide.largeSaveLabel
                    : categoryOutcome(category)}
                </span>
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
          <button className="secondary-action" onClick={openSavedRuns}>
            Saved runs
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
        {result.browserSupport.level === "experimental" &&
          " Firefox support is experimental; its web results are reported as measured without a browser-specific score adjustment."}
        {saveStatus === "saving" && " Saving this run on this device…"}
        {saveStatus === "saved" && " This run is saved on this device."}
        {saveStatus === "error" &&
          " Local saving was unavailable; use Export full result for this run."}
        {shareStatus === "sending" && " Sharing anonymous measurements…"}
        {shareStatus === "shared" && " Anonymous measurements were shared."}
        {shareStatus === "error" &&
          " Anonymous sharing was unavailable; your local result is unaffected."}
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
               <p>{result.score} out of 100 · {result.grade} grade</p>
               <h2 id="report-title">{guide.headline}</h2>
               <span>{guide.topSummary}</span>
             </div>
          </div>
          <PerformanceProfile
            profile={guide.performanceProfile}
            compact
          />
          <div className="flyer-levels">
             {guide.capabilityCards.map(
               (card: { id: string; title: string; rating: string }) => (
                 <article key={card.id}>
                   <span>{card.title}</span>
                   <strong>{card.rating}</strong>
                 </article>
               ),
             )}
             <article>
               <span>Web experience in {result.browser.split(" ")[0]}</span>
               <strong>{categoryOutcome(result.evidenceGroups.webExperience)}</strong>
             </article>
             <article>
               <span>Active-work capacity</span>
               <strong>{categoryOutcome(result.memory)}</strong>
             </article>
             <article>
               <span>Largest browser workloads</span>
               <strong>{categoryOutcome(result.headroom)}</strong>
             </article>
             <article>
               <span>Room for heavier work</span>
               <strong>{guide.reserve.label}</strong>
             </article>
             {guide.consistency.level !== "steady" && (
               <article>
                 <span>Consistency</span>
                 <strong>{guide.consistency.label}</strong>
               </article>
             )}
             {advancedWebWorkLabel && (
               <article>
                 <span>Large PDFs and data-heavy web apps</span>
                 <strong>{advancedWebWorkLabel}</strong>
               </article>
             )}
             <article>
               <span>Large saves</span>
               <strong>{guide.largeSaveLabel}</strong>
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
                 <span>Browser-reported platform</span>
                 <strong>{result.platform}</strong>
               </article>
               <article>
                 <span>Test duration</span>
                 <strong>{Math.max(1, Math.round(result.elapsedMs / 60000))} minutes</strong>
               </article>
               <article>
                 <span>Browser memory hint</span>
                 <strong>{result.memory.reportedMemoryLabel ?? "Not available"}</strong>
               </article>
               <article>
                <span>Run quality</span>
                <strong>{guide.runQuality.label}</strong>
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
    {showHistory && (
      <SavedRunsDialog
        runs={savedRuns}
        status={historyStatus}
        onClose={() => setShowHistory(false)}
        onDownload={downloadSavedRun}
        onDeleteAll={deleteSavedRuns}
      />
    )}
    </>
  );
}

type PerformanceProfileItem = {
  id: string;
  title: string;
  detail: string;
};

type PerformanceProfileData = {
  summary: string;
  wellRounded: boolean;
  strengths: PerformanceProfileItem[];
  limits: PerformanceProfileItem[];
};

function PerformanceProfile({
  profile,
  compact = false,
}: {
  profile: PerformanceProfileData;
  compact?: boolean;
}) {
  return (
    <section
      className={`performance-profile${compact ? " performance-profile-compact" : ""}`}
      aria-label="Performance profile"
    >
      <header>
        <p className="kicker">What stands out</p>
        <h2>{profile.summary}</h2>
      </header>
      <div className="performance-profile-columns">
        <article>
          <strong>{profile.wellRounded ? "Overall result" : "Best at"}</strong>
          {profile.strengths.length ? (
            <ul>
              {profile.strengths.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              Everyday categories finished close enough together that no
              single task clearly stood above the rest.
            </p>
          )}
        </article>
        <article>
          <strong>Likely to slow first</strong>
          {profile.limits.length ? (
            <ul>
              {profile.limits.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {profile.wellRounded
                ? "No clear weak area appeared in the everyday tests."
                : "No major limitation stood out in ordinary work."}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

function SavedRunsDialog({
  runs,
  status,
  onClose,
  onDownload,
  onDeleteAll,
}: {
  runs: SavedRunSummary[];
  status: "idle" | "loading" | "ready" | "error";
  onClose: () => void;
  onDownload: (run: SavedRunSummary) => void;
  onDeleteAll: () => void;
}) {
  return (
    <div
      className="guide-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="saved-runs-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-runs-title"
      >
        <button
          className="guide-close"
          onClick={onClose}
          aria-label="Close saved runs"
        >
          ×
        </button>
        <header>
          <p className="kicker">Private run history</p>
          <h2 id="saved-runs-title">Saved runs</h2>
          <p>
            Completed tests are saved only in this browser on this device.
            Download a full log before clearing browser data or moving devices.
          </p>
        </header>
        {status === "loading" && (
          <p className="history-message">Loading saved runs…</p>
        )}
        {status === "error" && (
          <p className="history-message">
            This browser could not open local run history. Existing downloads
            are unaffected.
          </p>
        )}
        {status === "ready" && runs.length === 0 && (
          <p className="history-message">
            No automatically saved runs yet. Your next completed test will
            appear here.
          </p>
        )}
        {status === "ready" && runs.length > 0 && (
          <>
            <div className="saved-runs-list">
              {runs.map((run) => (
                <article key={run.id}>
                  <div className="saved-run-grade">
                    <strong>{run.grade}</strong>
                    <span>Index {run.score}</span>
                  </div>
                  <div className="saved-run-copy">
                    <strong>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(run.startedAt))}
                    </strong>
                    <span>
                      {run.browser} · {run.platform}
                      {run.logicalProcessors
                        ? ` · ${run.logicalProcessors} logical processors`
                        : ""}
                    </span>
                    <small>
                      {run.responsivenessLabel} · {run.headroomLabel} reserve ·{" "}
                      {runQualityLabel(run.confidence)} run quality
                    </small>
                  </div>
                  <button onClick={() => onDownload(run)}>Download log</button>
                </article>
              ))}
            </div>
            <button className="history-delete" onClick={onDeleteAll}>
              Delete local history
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function BenchmarkVisual({
  stage,
  status,
  tick,
  browsingView,
  emailView,
  writingView,
  spreadsheetView,
  videoRef,
  canvasRef,
}: {
  stage: StageId;
  status: string;
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
        <p className="video-caption">
          Local test video · network excluded
        </p>
      </div>
    );
  }
  if (stage === "reserve") {
    return (
      <ReserveDashboard
        tick={tick}
        status={status}
        browsingView={browsingView}
        emailView={emailView}
        writingView={writingView}
        spreadsheetView={spreadsheetView}
        videoRef={videoRef}
      />
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
  if (stage === "memory") {
    return (
      <div className="test-visual memory-visual">
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            className={index <= (tick * 2) % 12 ? "active" : ""}
          />
        ))}
        <strong>Checking whether everyday actions stay responsive</strong>
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

function ReserveDashboard({
  tick,
  status,
  browsingView,
  emailView,
  writingView,
  spreadsheetView,
  videoRef,
}: {
  tick: number;
  status: string;
  browsingView: BrowsingView | null;
  emailView: EmailView | null;
  writingView: WritingView | null;
  spreadsheetView: SpreadsheetView | null;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const activity = ["Browsing", "Mail", "PDF", "Data app", "Photo", "Saving"];
  const higherLevel = status.includes("Escalating");
  const baseline = status.toLowerCase().includes("preparing");
  return (
    <div className="test-visual reserve-dashboard">
      <header>
        <div>
          <strong>
            {higherLevel
              ? "Higher reserve level"
              : baseline
                ? "Unloaded comparison"
                : "Several jobs at once"}
          </strong>
          <span>
            {baseline
              ? "Establishing the paired baseline"
              : higherLevel
                ? "Larger data, memory, saving, and media work are active"
                : "Repeating the same actions while advanced web work runs"}
          </span>
        </div>
        <em>
          {higherLevel
            ? "Level 2 · higher pressure"
            : baseline
              ? "Paired baseline"
              : tick % 2
                ? "Level 1 · mixed pressure"
                : "Level 1 · sustained pressure"}
        </em>
      </header>
      <div className="reserve-grid">
        <article className="reserve-panel reserve-browser">
          <small>Web</small>
          <strong>{browsingView?.actionName ?? "Updating a busy page"}</strong>
          {(browsingView?.items ?? []).slice(0, 8).map((item) => (
            <i key={item.id} style={{ width: `${45 + (item.id % 45)}%` }} />
          ))}
        </article>
        <article className="reserve-panel reserve-mail">
          <small>Inbox</small>
          <strong>{emailView?.actionName ?? "Searching and switching mail"}</strong>
          {(emailView?.rows ?? []).slice(0, 7).map((row) => (
            <span key={row.id}>{row.sender}</span>
          ))}
        </article>
        <article className="reserve-panel reserve-document">
          <small>Document</small>
          <strong>{writingView?.actionName ?? "Reflowing a long document"}</strong>
          {(writingView?.paragraphs ?? []).slice(0, 7).map((paragraph) => (
            <i key={paragraph.id} style={{ width: `${55 + (paragraph.id % 38)}%` }} />
          ))}
        </article>
        <article className="reserve-panel reserve-sheet">
          <small>Spreadsheet</small>
          <strong>{spreadsheetView?.actionName ?? "Recalculating formulas"}</strong>
          <div>
            {(spreadsheetView?.rows ?? []).slice(0, 12).map((row) => (
              <i key={row.row}>{row.row}</i>
            ))}
          </div>
        </article>
        <article className="reserve-panel reserve-media">
          <small>Media</small>
          <video ref={videoRef} muted playsInline preload="auto" />
          <span>Video playing while a photo is edited</span>
        </article>
        <article className="reserve-panel reserve-activity">
          <small>Active work</small>
          {activity.map((label, index) => (
            <span key={label} className={index === tick % activity.length ? "active" : ""}>
              <i /> {label}
            </span>
          ))}
        </article>
      </div>
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
