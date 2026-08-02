export type LocalRunSummary = {
  id: string;
  createdAt: string;
  startedAt: string;
  profileVersion: string;
  grade: string;
  score: number;
  confidence: string;
  browser: string;
  platform: string;
  logicalProcessors: number | null;
  elapsedMs: number;
  responsivenessLabel: string;
  responsivenessScore: number | null;
  headroomLabel: string;
  headroomScore: number;
};

export type RecentRunRange = {
  available: boolean;
  comparableRuns: number;
  minimumScore: number | null;
  maximumScore: number | null;
  span: number | null;
  variable: boolean;
  message: string;
};

type ResultEnvelope = {
  schemaVersion?: unknown;
  result?: Record<string, unknown>;
};

type StoredRun = LocalRunSummary & {
  envelope: ResultEnvelope;
};

const DATABASE_NAME = "stillgood-history";
const DATABASE_VERSION = 1;
const STORE_NAME = "runs";
const MAX_SAVED_RUNS = 50;

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function openHistoryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("startedAt", "startedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local history"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Local history transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Local history transaction was cancelled"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local history request failed"));
  });
}

function summaryFromEnvelope(envelope: ResultEnvelope): LocalRunSummary {
  const result = objectValue(envelope.result);
  const responsiveness = objectValue(result.responsiveness);
  const headroom = objectValue(result.headroom);
  const startedAt = stringValue(result.startedAt, new Date().toISOString());
  const profileVersion = stringValue(result.profileVersion, "unknown-profile");

  return {
    id: `${profileVersion}:${startedAt}`,
    createdAt: new Date().toISOString(),
    startedAt,
    profileVersion,
    grade: stringValue(result.grade, "—"),
    score: numberValue(result.score),
    confidence: stringValue(result.confidence, "Unknown"),
    browser: stringValue(result.browser, "Browser not reported"),
    platform: stringValue(result.platform, "Platform not reported"),
    logicalProcessors:
      typeof result.logicalProcessors === "number"
        ? numberValue(result.logicalProcessors)
        : null,
    elapsedMs: numberValue(result.elapsedMs),
    responsivenessLabel: stringValue(responsiveness.label, "Not measured"),
    responsivenessScore:
      typeof responsiveness.score === "number"
        ? numberValue(responsiveness.score)
        : null,
    headroomLabel: stringValue(headroom.label, "Not measured"),
    headroomScore: numberValue(headroom.score),
  };
}

export async function saveLocalRun(envelope: ResultEnvelope) {
  if (!envelope.schemaVersion || !envelope.result) {
    throw new Error("This is not a complete StillGood result");
  }

  const database = await openHistoryDatabase();
  try {
    const summary = summaryFromEnvelope(envelope);
    const writeTransaction = database.transaction(STORE_NAME, "readwrite");
    writeTransaction.objectStore(STORE_NAME).put({ ...summary, envelope });
    await transactionDone(writeTransaction);

    const runs = await listLocalRuns();
    if (runs.length > MAX_SAVED_RUNS) {
      const pruneTransaction = database.transaction(STORE_NAME, "readwrite");
      const store = pruneTransaction.objectStore(STORE_NAME);
      for (const run of runs.slice(MAX_SAVED_RUNS)) store.delete(run.id);
      await transactionDone(pruneTransaction);
    }
    return summary;
  } finally {
    database.close();
  }
}

export async function listLocalRuns(): Promise<LocalRunSummary[]> {
  const database = await openHistoryDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const stored = await requestResult(
      transaction.objectStore(STORE_NAME).getAll() as IDBRequest<StoredRun[]>,
    );
    await transactionDone(transaction);
    return stored
      .map(({ envelope, ...summary }) => {
        void envelope;
        return summary;
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  } finally {
    database.close();
  }
}

export async function getLocalRun(id: string): Promise<ResultEnvelope | null> {
  const database = await openHistoryDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const stored = await requestResult(
      transaction.objectStore(STORE_NAME).get(id) as IDBRequest<StoredRun | undefined>,
    );
    await transactionDone(transaction);
    return stored?.envelope ?? null;
  } finally {
    database.close();
  }
}

export async function clearLocalRuns(): Promise<void> {
  const database = await openHistoryDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
