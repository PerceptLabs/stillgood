const SENDERS = [
  "Maya Chen",
  "Repair Fair",
  "Jordan Ellis",
  "Community Lab",
  "Device Intake",
  "Alex Morgan",
  "Workshop Desk",
  "Sam Rivera",
];

const SUBJECTS = [
  "Repair fair schedule",
  "Laptop pickup confirmed",
  "Battery inspection notes",
  "Parts order update",
  "Volunteer shift",
  "Device intake follow-up",
  "Workshop checklist",
  "Recycling event details",
];

const DEVICE_MODELS = [
  "Chromebook 13",
  "Latitude 7490",
  "ThinkPad T480",
  "EliteBook 840",
  "MacBook Air",
  "Aspire 5",
];

function nextValue(state) {
  return (state * 1664525 + 1013904223) >>> 0;
}

function checksumNumbers(values) {
  return values.reduce(
    (checksum, value) => ((checksum << 5) - checksum + value) >>> 0,
    2166136261,
  );
}

export const inboxActionNames = [
  "Search messages",
  "Open a conversation",
  "Select and label messages",
  "Compose a reply",
  "Switch folders",
];

export const documentActionNames = [
  "Find text",
  "Edit a paragraph",
  "Apply formatting",
  "Sort the inventory table",
  "Save and reopen",
];

export function buildInboxDataset(seed, size) {
  let state = seed >>> 0;
  return Array.from({ length: size }, (_, index) => {
    state = nextValue(state);
    const sender = SENDERS[state % SENDERS.length];
    state = nextValue(state);
    const subject = SUBJECTS[state % SUBJECTS.length];
    state = nextValue(state);
    const folderRoll = state % 10;
    return {
      id: index + 1,
      sender,
      subject,
      body: `${subject}. Record ${index + 1} includes practical repair notes, appointment details, and the next action for this device.`,
      folder: folderRoll < 7 ? "inbox" : folderRoll < 9 ? "archive" : "sent",
      unread: (state & 3) === 0,
      received: 2_000_000_000 - index * 97 - (state % 89),
      label: (state & 7) === 0 ? "Follow up" : "",
    };
  });
}

export function createInboxView(messages, actionIndex, domRows, seed) {
  const action = actionIndex % inboxActionNames.length;
  const query = action <= 3 ? "repair" : "";
  const folder = action === 4 ? "archive" : "inbox";
  let matching = messages.filter(
    (message) =>
      message.folder === folder &&
      (!query ||
        message.subject.toLowerCase().includes(query) ||
        message.body.toLowerCase().includes(query) ||
        message.sender.toLowerCase().includes(query)),
  );
  if (!matching.length)
    matching = messages.filter((message) => message.folder === folder);

  matching.sort(
    action === 2
      ? (left, right) => left.sender.localeCompare(right.sender)
      : (left, right) => right.received - left.received,
  );
  const selectedIds =
    action === 2
      ? new Set(matching.slice(0, Math.min(16, matching.length)).map((item) => item.id))
      : new Set();
  const activeMessage = action === 1 ? matching[Math.min(3, matching.length - 1)] : null;
  const rows = matching.slice(0, domRows).map((message) => ({
    ...message,
    selected: selectedIds.has(message.id),
    label: selectedIds.has(message.id) ? "Reviewed" : message.label,
  }));
  const draft =
    action === 3
      ? "Thanks for the update. I reviewed the repair notes and confirmed the device intake appointment."
      : "";
  const checksum = checksumNumbers([
    seed,
    action,
    matching.length,
    ...rows.slice(0, 32).map((row) => row.id),
    activeMessage?.id ?? 0,
    draft.length,
  ]);
  return {
    actionName: inboxActionNames[action],
    query,
    folder,
    totalMatches: matching.length,
    rows,
    activeMessage,
    draft,
    checksum,
    success:
      rows.length > 0 &&
      (action !== 1 || activeMessage != null) &&
      (action !== 3 || draft.length > 40),
  };
}

export function buildDocumentDataset(seed, size) {
  let state = seed >>> 0;
  const paragraphCount = Math.min(1200, Math.max(24, Math.round(size / 80)));
  const tableCount = Math.min(5000, Math.max(60, Math.round(size / 15)));
  const paragraphs = Array.from({ length: paragraphCount }, (_, index) => {
    state = nextValue(state);
    const topic =
      index % 7 === 0
        ? "battery inspection"
        : index % 5 === 0
          ? "device intake"
          : "refurbishment notes";
    return {
      id: index + 1,
      text: `Section ${index + 1}: ${topic}. The technician recorded condition ${state % 100}, verified the checklist, and assigned the next repair action.`,
    };
  });
  const tableRows = Array.from({ length: tableCount }, (_, index) => {
    state = nextValue(state);
    return {
      id: index + 1,
      model: DEVICE_MODELS[state % DEVICE_MODELS.length],
      year: 2012 + (state % 14),
      status: ["Ready", "Inspect", "Repair", "Recycle"][(state >>> 3) % 4],
      score: state % 1000,
    };
  });
  return { paragraphs, tableRows };
}

export function createDocumentView(documentModel, actionIndex, domRows, seed) {
  const action = actionIndex % documentActionNames.length;
  const query = action === 0 ? "battery inspection" : "";
  let paragraphs = documentModel.paragraphs;
  let tableRows = documentModel.tableRows;
  let saved = false;

  if (action === 1) {
    const editIndex = Math.min(5, paragraphs.length - 1);
    paragraphs = paragraphs.map((paragraph, index) =>
      index === editIndex
        ? {
            ...paragraph,
            text: `${paragraph.text} The owner approved the recommended next step.`,
          }
        : paragraph,
    );
  } else if (action === 3) {
    tableRows = [...tableRows].sort(
      (left, right) => right.year - left.year || left.model.localeCompare(right.model),
    );
  } else if (action === 4) {
    const reopened = JSON.parse(
      JSON.stringify({
        paragraphs: documentModel.paragraphs,
        tableRows: documentModel.tableRows,
      }),
    );
    paragraphs = reopened.paragraphs;
    tableRows = reopened.tableRows;
    saved = true;
  }

  const visibleParagraphs = paragraphs.slice(0, domRows).map((paragraph, index) => ({
    ...paragraph,
    match: Boolean(query && paragraph.text.includes(query)),
    bold: action === 2 && index % 5 === 0,
  }));
  const visibleTableRows = tableRows.slice(
    0,
    Math.min(160, Math.max(24, Math.round(domRows / 2))),
  );
  const checksum = checksumNumbers([
    seed,
    action,
    paragraphs.length,
    tableRows.length,
    ...visibleParagraphs.slice(0, 24).map((paragraph) => paragraph.text.length),
    ...visibleTableRows.slice(0, 24).map((row) => row.id + row.year),
    saved ? 1 : 0,
  ]);
  return {
    actionName: documentActionNames[action],
    title: "Community Device Refurbishment Log",
    query,
    paragraphs: visibleParagraphs,
    tableRows: visibleTableRows,
    matchCount: query
      ? paragraphs.filter((paragraph) => paragraph.text.includes(query)).length
      : 0,
    saved,
    checksum,
    success:
      visibleParagraphs.length > 0 &&
      visibleTableRows.length > 0 &&
      (action !== 0 || visibleParagraphs.some((paragraph) => paragraph.match)) &&
      (action !== 4 || saved),
  };
}
