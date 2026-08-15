const encoder = new TextEncoder();

function escapePdfText(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function buildBenchmarkPdf({
  pageCount = 28,
  linesPerPage = 38,
  seed = 1,
} = {}) {
  const pages = Math.max(4, Math.min(96, Math.floor(pageCount)));
  const lines = Math.max(16, Math.min(52, Math.floor(linesPerPage)));
  const objects = new Map();
  const pageIds = Array.from({ length: pages }, (_, index) => 4 + index * 2);

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages} >>`,
  );
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
    const pageId = pageIds[pageIndex];
    const contentId = pageId + 1;
    const textLines = [
      `StillGood device handbook - page ${pageIndex + 1}`,
      `Device intake ${seed}-${pageIndex + 1} - repair notes and service history`,
      "SECOND-LIFE CHECKPOINT: practical documents should stay responsive.",
    ];
    for (let line = textLines.length; line < lines; line += 1) {
      const item = (seed * 97 + pageIndex * 41 + line * 17) % 10007;
      textLines.push(
        `Record ${String(item).padStart(5, "0")}  Workshop ${line % 9}  ` +
          `inspection ${line % 5}  status ${(pageIndex + line) % 7}  ` +
          "battery display keyboard storage network notes",
      );
    }
    const textCommands = textLines
      .map((line, index) => `${index ? "T* " : ""}(${escapePdfText(line)}) Tj`)
      .join("\n");
    const bars = Array.from({ length: 22 }, (_, index) => {
      const width = 80 + ((seed + pageIndex * 13 + index * 23) % 430);
      const shade = (0.18 + ((index + pageIndex) % 7) * 0.08).toFixed(2);
      return `${shade} g 44 ${42 + index * 5} ${width} 2 re f`;
    }).join("\n");
    const stream = `BT\n/F1 9 Tf\n44 752 Td\n12 TL\n${textCommands}\nET\n${bars}`;
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
        `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.set(contentId, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }

  const maximumId = 3 + pages * 2;
  let output = "%PDF-1.4\n";
  const offsets = new Array(maximumId + 1).fill(0);
  for (let id = 1; id <= maximumId; id += 1) {
    offsets[id] = output.length;
    output += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefOffset = output.length;
  output += `xref\n0 ${maximumId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maximumId; id += 1) {
    output += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  output +=
    `trailer\n<< /Size ${maximumId + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  return encoder.encode(output);
}

export function buildParserSource(moduleCount = 260, seed = 1) {
  const count = Math.max(40, Math.min(900, Math.floor(moduleCount)));
  const chunks = [
    "const registry = new Map();",
    "const normalize = value => String(value).trim().toLowerCase();",
  ];
  for (let index = 0; index < count; index += 1) {
    const offset = (seed * 29 + index * 17) % 997;
    chunks.push(`
class DeviceRecord${index} {
  constructor(id, title, score = ${offset}) {
    this.id = id;
    this.title = title;
    this.score = score;
    this.tags = new Set(["device", id % 2 ? "portable" : "desktop"]);
  }
  matches(query) {
    const pattern = /[a-z0-9]+(?:[-_][a-z0-9]+)*/giu;
    return [...normalize(this.title).matchAll(pattern)].some(([word]) => word.includes(query));
  }
  toJSON() { return { id: this.id, title: this.title, score: this.score, tags: [...this.tags] }; }
}
function transform${index}(rows, query = "device") {
  return rows
    .map((row, position) => new DeviceRecord${index}(row.id ?? position, row.title ?? ("item-" + position), row.score))
    .filter(record => record.matches(query) || record.score > ${offset % 80})
    .sort((left, right) => right.score - left.score)
    .slice(0, ${12 + (index % 19)});
}
registry.set("module-${index}", transform${index});`);
  }
  chunks.push("export { registry, normalize };");
  return chunks.join("\n");
}

export function buildJsonRecords(recordCount = 12000, seed = 1) {
  const count = Math.max(1000, Math.min(48000, Math.floor(recordCount)));
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    folder: `folder-${(index + seed) % 37}`,
    title: `Device service record ${seed}-${index}`,
    status: ["ready", "review", "repair", "archive"][(index + seed) % 4],
    score: (index * 47 + seed * 19) % 1000,
    tags: [
      `year-${2012 + (index % 15)}`,
      `type-${index % 9}`,
      index % 3 ? "portable" : "desktop",
    ],
    notes:
      "Inspection notes include battery, display, keyboard, storage, networking, and software status.",
  }));
}
