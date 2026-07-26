const SENDERS = [
  "Maya Chen",
  "Repair Fair",
  "Jordan Ellis",
  "Community Lab",
  "Device Intake",
  "Alex Morgan",
  "Workshop Desk",
  "Sam Rivera",
  "Parts Cooperative",
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
  "Monthly repair newsletter",
];

const DOCUMENT_WORDS = [
  "device",
  "inspection",
  "battery",
  "condition",
  "repair",
  "community",
  "technician",
  "recommended",
  "replacement",
  "testing",
  "workshop",
  "refurbishment",
  "system",
  "display",
  "keyboard",
  "storage",
  "reliable",
  "performance",
  "verified",
  "owner",
  "follow-up",
  "documentation",
];

const MODELS = [
  "Chromebook 13",
  "Latitude 7490",
  "ThinkPad T480",
  "EliteBook 840",
  "MacBook Air",
  "Aspire 5",
  "IdeaPad 3",
  "Surface Laptop",
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

function wordsForParagraph(index, length, seed) {
  const words = [];
  let state = (seed + index * 97) >>> 0;
  for (let wordIndex = 0; wordIndex < length; wordIndex += 1) {
    state = nextValue(state);
    words.push(DOCUMENT_WORDS[state % DOCUMENT_WORDS.length]);
  }
  const topic =
    index % 11 === 0
      ? "battery inspection"
      : index % 7 === 0
        ? "device intake"
        : "refurbishment notes";
  return `Section ${index + 1}: ${topic}. ${words.join(" ")}.`;
}

export const emailActionNames = [
  "Search a large mailbox",
  "Open a long conversation",
  "Select, sort, and label",
  "Compose a rich reply",
  "Switch folders",
  "Open an HTML newsletter",
];

export function buildEmailDataset(seed, size) {
  let state = seed >>> 0;
  return Array.from({ length: size }, (_, index) => {
    state = nextValue(state);
    const sender = SENDERS[state % SENDERS.length];
    state = nextValue(state);
    const subject = SUBJECTS[state % SUBJECTS.length];
    state = nextValue(state);
    const folderRoll = state % 10;
    const kind = index % 37 === 0 ? "newsletter" : "message";
    const threadLength = kind === "newsletter" ? 1 : 2 + (state % 14);
    const body = `${subject}. Record ${index + 1} includes practical repair notes, appointment details, parts availability, quoted history, and the next action for this device.`;
    return {
      id: index + 1,
      sender,
      subject,
      body,
      kind,
      threadLength,
      folder: folderRoll < 7 ? "inbox" : folderRoll < 9 ? "archive" : "sent",
      unread: (state & 3) === 0,
      received: 2_000_000_000 - index * 97 - (state % 89),
      label: (state & 7) === 0 ? "Follow up" : "",
    };
  });
}

function buildThread(message, seed) {
  return Array.from({ length: message.threadLength }, (_, index) => ({
    id: `${message.id}-${index}`,
    sender: index % 3 === 0 ? message.sender : "Workshop Desk",
    body: `${message.body} ${
      index % 2
        ? "The reply includes quoted context, a checklist, and scheduling details."
        : "The message includes a status summary and several follow-up questions."
    } ${"Additional context for browser layout and word wrapping. ".repeat(2 + ((seed + index) % 4))}`,
  }));
}

export function createEmailView(messages, actionIndex, domRows, seed) {
  const action = actionIndex % emailActionNames.length;
  const query = action === 0 ? "repair" : "";
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
      ? new Set(matching.slice(0, Math.min(50, matching.length)).map((item) => item.id))
      : new Set();
  const activeMessage =
    action === 1
      ? matching[Math.min(7, matching.length - 1)]
      : action === 5
        ? messages.find(
            (message) => message.folder === "inbox" && message.kind === "newsletter",
          )
        : null;
  const rows = matching.slice(0, Math.min(100, domRows)).map((message) => ({
    ...message,
    selected: selectedIds.has(message.id),
    label: selectedIds.has(message.id) ? "Reviewed" : message.label,
  }));
  const draftBlocks =
    action === 3
      ? [
          "Thanks for the detailed update.",
          "I reviewed the repair notes and confirmed the intake appointment.",
          "Please keep the battery inspection and parts checklist attached to this thread.",
        ]
      : [];
  const thread = activeMessage ? buildThread(activeMessage, seed) : [];
  const checksum = checksumNumbers([
    seed,
    action,
    matching.length,
    ...rows.slice(0, 32).map((row) => row.id),
    activeMessage?.id ?? 0,
    thread.reduce((sum, item) => sum + item.body.length, 0),
    draftBlocks.join("").length,
  ]);
  return {
    actionName: emailActionNames[action],
    query,
    folder,
    totalMatches: matching.length,
    totalMessages: messages.length,
    rows,
    activeMessage,
    thread,
    draftBlocks,
    checksum,
    success:
      rows.length > 0 &&
      (action !== 1 || thread.length > 1) &&
      (action !== 3 || draftBlocks.length === 3) &&
      (action !== 5 || activeMessage?.kind === "newsletter"),
  };
}

export const writingActionNames = [
  "Open and lay out document",
  "Find text",
  "Edit near the beginning",
  "Rewrap the full document",
  "Apply rich formatting",
  "Insert and lay out a table",
  "Save and reopen",
];

export function buildWritingDataset(seed, targetWords) {
  const paragraphCount = Math.max(18, Math.ceil(targetWords / 86));
  let remaining = targetWords;
  const paragraphs = Array.from({ length: paragraphCount }, (_, index) => {
    const paragraphsLeft = paragraphCount - index;
    const wordCount = Math.max(
      24,
      Math.round(remaining / Math.max(1, paragraphsLeft)),
    );
    remaining -= wordCount;
    return {
      id: index + 1,
      text: wordsForParagraph(index, wordCount, seed),
      heading: index % 12 === 0,
    };
  });
  const tableRows = Array.from({ length: 36 }, (_, index) => ({
    id: index + 1,
    model: MODELS[(seed + index * 7) % MODELS.length],
    year: 2012 + ((seed + index * 11) % 14),
    status: ["Ready", "Inspect", "Repair", "Recycle"][(seed + index) % 4],
  }));
  return { paragraphs, tableRows, targetWords };
}

export function createWritingView(documentModel, actionIndex, domRows, seed) {
  const action = actionIndex % writingActionNames.length;
  const query = action === 1 ? "battery inspection" : "";
  let paragraphs = documentModel.paragraphs;
  let tableRows = [];
  let saved = false;

  if (action === 2) {
    const editIndex = Math.min(2, paragraphs.length - 1);
    paragraphs = paragraphs.map((paragraph, index) =>
      index === editIndex
        ? {
            ...paragraph,
            text: `${paragraph.text} The owner approved the recommended next step, which changes the wrapping of every following line.`,
          }
        : paragraph,
    );
  } else if (action === 5) {
    tableRows = [...documentModel.tableRows].sort(
      (left, right) => right.year - left.year || left.model.localeCompare(right.model),
    );
  } else if (action === 6) {
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

  const visibleParagraphs = paragraphs
    .slice(0, Math.min(domRows, paragraphs.length))
    .map((paragraph, index) => ({
      ...paragraph,
      match: Boolean(query && paragraph.text.includes(query)),
      bold: action === 4 && index % 7 === 0,
      italic: action === 4 && index % 11 === 0,
    }));
  const matchCount = query
    ? paragraphs.filter((paragraph) => paragraph.text.includes(query)).length
    : 0;
  const checksum = checksumNumbers([
    seed,
    action,
    paragraphs.length,
    documentModel.targetWords,
    ...visibleParagraphs.slice(0, 24).map((paragraph) => paragraph.text.length),
    ...tableRows.slice(0, 24).map((row) => row.id + row.year),
    saved ? 1 : 0,
  ]);
  return {
    actionName: writingActionNames[action],
    title: "Community Device Refurbishment Report",
    query,
    paragraphs: visibleParagraphs,
    tableRows,
    matchCount,
    saved,
    wordCount: documentModel.targetWords,
    editorWidth: action === 3 ? 520 : 720,
    layoutMode: action === 3 ? "Narrow page reflow" : "Standard page",
    checksum,
    success:
      visibleParagraphs.length > 0 &&
      (action !== 1 || matchCount > 0) &&
      (action !== 2 ||
        visibleParagraphs.some((paragraph) =>
          paragraph.text.includes("changes the wrapping"),
        )) &&
      (action !== 5 || tableRows.length > 0) &&
      (action !== 6 || saved),
  };
}

export const spreadsheetActionNames = [
  "Open workbook",
  "Edit and recalculate formulas",
  "Sort a large range",
  "Filter several columns",
  "Paste a 1,000-cell block",
  "Search the workbook",
  "Scroll to a distant range",
];

export function buildSpreadsheetDataset(seed, cellCount) {
  const columns = 10;
  const rowCount = Math.max(100, Math.ceil(cellCount / columns));
  const quantity = new Uint16Array(rowCount);
  const unitPrice = new Float64Array(rowCount);
  const condition = new Uint8Array(rowCount);
  let state = seed >>> 0;
  for (let row = 0; row < rowCount; row += 1) {
    state = nextValue(state);
    quantity[row] = 1 + (state % 48);
    state = nextValue(state);
    unitPrice[row] = 4 + (state % 24000) / 100;
    condition[row] = state % 4;
  }
  return { seed, cellCount, columns, rowCount, quantity, unitPrice, condition };
}

function recalculateWorkbook(model, edited = false, priceOverride = null) {
  const totals = new Float64Array(model.rowCount);
  let runningTotal = 0;
  let checksum = 0;
  for (let row = 0; row < model.rowCount; row += 1) {
    const quantity = edited && row === 0 ? model.quantity[row] + 3 : model.quantity[row];
    const unitPrice = priceOverride?.[row] ?? model.unitPrice[row];
    const subtotal = quantity * unitPrice;
    const tax = subtotal * (0.045 + (model.condition[row] % 3) * 0.0125);
    runningTotal += subtotal + tax;
    totals[row] = runningTotal * (1 + (model.condition[row] - 1.5) * 0.008);
    if (row % 97 === 0) checksum = (checksum + Math.round(totals[row])) >>> 0;
  }
  return { totals, checksum };
}

function spreadsheetRows(model, indices, totals) {
  return indices.map((row) => ({
    row: row + 1,
    cells: [
      MODELS[(model.seed + row * 3) % MODELS.length],
      2012 + ((model.seed + row * 7) % 14),
      ["Ready", "Inspect", "Repair", "Recycle"][model.condition[row]],
      model.quantity[row],
      model.unitPrice[row].toFixed(2),
      (model.quantity[row] * model.unitPrice[row]).toFixed(2),
      totals[row].toFixed(2),
      row % 5 === 0 ? "Follow up" : "",
      `SG-${String(row + 1).padStart(6, "0")}`,
      ((totals[row] / Math.max(1, row + 1)) % 100).toFixed(1),
    ],
  }));
}

export function createSpreadsheetView(model, actionIndex, viewportRows, seed) {
  const action = actionIndex % spreadsheetActionNames.length;
  let indices = Array.from({ length: model.rowCount }, (_, row) => row);
  let query = "";
  let pasteCount = 0;
  let editedPrices = null;

  if (action === 4) {
    editedPrices = model.unitPrice.slice();
    pasteCount = Math.min(1000, editedPrices.length);
    for (let index = 0; index < pasteCount; index += 1)
      editedPrices[index] =
        Math.round((editedPrices[index] * 1.035 + (index % 7)) * 100) / 100;
  }
  const calculation = recalculateWorkbook(
    model,
    action === 1,
    editedPrices,
  );

  if (action === 2) {
    indices.sort(
      (left, right) =>
        calculation.totals[right] - calculation.totals[left] || left - right,
    );
  } else if (action === 3) {
    indices = indices.filter(
      (row) =>
        model.condition[row] !== 3 &&
        model.quantity[row] >= 12 &&
        model.unitPrice[row] >= 40,
    );
  } else if (action === 5) {
    query = "Chromebook";
    indices = indices.filter(
      (row) => MODELS[(model.seed + row * 3) % MODELS.length] === "Chromebook 13",
    );
  }

  const start =
    action === 6
      ? Math.max(0, indices.length - Math.min(viewportRows, indices.length))
      : 0;
  const visibleIndices = indices.slice(start, start + viewportRows);
  const rows = spreadsheetRows(model, visibleIndices, calculation.totals);
  const checksum = checksumNumbers([
    seed,
    action,
    model.cellCount,
    indices.length,
    calculation.checksum,
    pasteCount,
    ...visibleIndices.slice(0, 24),
  ]);
  return {
    actionName: spreadsheetActionNames[action],
    title: "Refurbishment Inventory and Budget",
    rows,
    query,
    totalRows: model.rowCount,
    visibleMatches: indices.length,
    cellCount: model.cellCount,
    recalculatedCells: model.rowCount * 4,
    pasteCount,
    startRow: visibleIndices[0] ?? 0,
    checksum,
    success:
      rows.length > 0 &&
      (action !== 3 || indices.length < model.rowCount) &&
      (action !== 4 || pasteCount > 0) &&
      (action !== 5 || query.length > 0) &&
      (action !== 6 || (visibleIndices[0] ?? 0) > 0),
  };
}
