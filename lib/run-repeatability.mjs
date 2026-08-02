function browserFamily(label = "") {
  const normalized = label.toLowerCase();
  if (normalized.includes("firefox")) return "firefox";
  if (normalized.includes("edge")) return "edge";
  if (normalized.includes("chrome") || normalized.includes("chromium"))
    return "chromium";
  return normalized.split(/\s+/)[0] || "unknown";
}

export function summarizeRecentRunRange(current, previousRuns = []) {
  const comparable = previousRuns
    .filter(
      (run) =>
        run.profileVersion === current.profileVersion &&
        browserFamily(run.browser) === browserFamily(current.browser) &&
        run.platform === current.platform &&
        run.logicalProcessors === current.logicalProcessors,
    )
    .slice(0, 4);
  const scores = [current.score, ...comparable.map((run) => run.score)].filter(
    Number.isFinite,
  );
  if (scores.length < 2) {
    return {
      available: false,
      comparableRuns: scores.length,
      minimumScore: null,
      maximumScore: null,
      span: null,
      variable: false,
      message: "Run this check again to establish a repeatability range.",
    };
  }
  const minimumScore = Math.min(...scores);
  const maximumScore = Math.max(...scores);
  const span = maximumScore - minimumScore;
  const variable = span > 5;
  return {
    available: true,
    comparableRuns: scores.length,
    minimumScore,
    maximumScore,
    span,
    variable,
    message: variable
      ? `Recent comparable runs ranged from ${minimumScore} to ${maximumScore}. Performance varies between runs, so use this range rather than one point.`
      : `Recent comparable runs stayed within ${minimumScore}-${maximumScore}, which is a stable range.`,
  };
}
