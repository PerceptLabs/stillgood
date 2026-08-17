const gradeBoundaries = [45, 58, 68, 74, 78, 82, 86, 90, 94, 98];
const capabilityBoundaries = [56, 66, 76, 86, 94];

const coreCategories = [
  { id: "browsing", weight: 0.22 },
  { id: "multitasking", weight: 0.17 },
  { id: "spreadsheets", weight: 0.1 },
  { id: "email", weight: 0.09 },
  { id: "writing", weight: 0.09 },
];

function nearestBoundary(value, boundaries, margin) {
  if (!Number.isFinite(value)) return null;
  return boundaries
    .map((boundary) => ({ boundary, distance: Math.abs(value - boundary) }))
    .filter((candidate) => candidate.distance <= margin)
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
}

export function planBoundaryConfirmation(
  summary,
  { margin = 1, maxCategories = 3 } = {},
) {
  const base = {
    needed: false,
    margin,
    gradeBoundary: null,
    capabilityBoundaries: [],
    categories: [],
    reason: "not-near-boundary",
  };
  if (!summary || summary.confidence === "Low") {
    return {
      ...base,
      reason: summary?.confidence === "Low" ? "low-confidence" : "no-summary",
    };
  }

  const measured = coreCategories
    .map((category) => ({
      ...category,
      score: Number.isFinite(summary[category.id]?.score1000)
        ? summary[category.id].score1000 / 10
        : summary[category.id]?.score,
      variability: summary[category.id]?.medianCv ?? 0,
    }))
    .filter((category) => Number.isFinite(category.score));
  if (!measured.length) return base;

  const exactOverallScore = Number.isFinite(summary.internalScoring?.final)
    ? summary.internalScoring.final / 10
    : summary.score;
  const gradeBoundary = nearestBoundary(
    exactOverallScore,
    gradeBoundaries,
    margin,
  );
  const nearCapabilities = measured
    .map((category) => ({
      id: category.id,
      ...nearestBoundary(category.score, capabilityBoundaries, margin),
    }))
    .filter((candidate) => Number.isFinite(candidate.boundary))
    .sort((left, right) => left.distance - right.distance);
  if (!gradeBoundary && !nearCapabilities.length) return base;

  const selected = [];
  const add = (id) => {
    if (id && !selected.includes(id) && selected.length < maxCategories)
      selected.push(id);
  };

  if (gradeBoundary) {
    const weakest = [...measured].sort(
      (left, right) => left.score - right.score,
    )[0];
    const mostInfluential = [...measured].sort(
      (left, right) =>
        right.weight * (1 + right.variability * 4) -
        left.weight * (1 + left.variability * 4),
    )[0];
    add(weakest.id);
    add(mostInfluential.id);
  }
  nearCapabilities.forEach((candidate) => add(candidate.id));

  return {
    needed: selected.length > 0,
    margin,
    gradeBoundary: gradeBoundary?.boundary ?? null,
    capabilityBoundaries: nearCapabilities.map((candidate) => ({
      category: candidate.id,
      boundary: candidate.boundary,
    })),
    categories: selected,
    reason: gradeBoundary ? "grade-boundary" : "capability-boundary",
  };
}
