/**
 * Firefox-only calibration against the unchanged Chromium reference path.
 *
 * The provisional factors are geometric means from two matched physical
 * systems spanning a low-power second-life laptop and a workstation:
 *
 *   graphics:          sqrt((89 / 84) * (100 / 93))
 *   everyday graphics: sqrt((98 / 89) * (100 / 96))
 *   headroom:          sqrt((86 / 78) * (92 / 85))
 *
 * Raw Firefox measurements remain in the result. These factors affect only
 * the computer-grade evidence. Chromium and every other browser use identity
 * factors and therefore retain the existing scoring path.
 */
export const browserNormalizationProfile = Object.freeze({
  version: "firefox-reference-v1.0",
  referenceBrowser: "chromium",
  firefox: Object.freeze({
    calibrationPairs: 2,
    graphicsScoreFactor: 1.06736728142962,
    graphicsEverydayFactor: 1.07098260738368,
    headroomFactor: 1.09241178099005,
  }),
});

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeBrowserEvidence({
  browserFamily,
  graphics,
  headroom,
}) {
  const rawGraphicsScore = graphics?.score ?? 0;
  const rawGraphicsEverydayScore =
    graphics?.everydayScore ?? rawGraphicsScore;
  const rawHeadroomScore = headroom?.score ?? 0;
  const isFirefox = browserFamily === "firefox";
  const calibration = browserNormalizationProfile.firefox;

  return {
    applied: isFirefox,
    browserFamily: browserFamily ?? "unknown",
    profileVersion: browserNormalizationProfile.version,
    referenceBrowser: browserNormalizationProfile.referenceBrowser,
    calibrationPairs: isFirefox ? calibration.calibrationPairs : 0,
    rawGraphicsScore,
    normalizedGraphicsScore: isFirefox
      ? clampScore(rawGraphicsScore * calibration.graphicsScoreFactor)
      : rawGraphicsScore,
    rawGraphicsEverydayScore,
    normalizedGraphicsEverydayScore: isFirefox
      ? clampScore(
          rawGraphicsEverydayScore * calibration.graphicsEverydayFactor,
        )
      : rawGraphicsEverydayScore,
    rawHeadroomScore,
    normalizedHeadroomScore: isFirefox
      ? clampScore(rawHeadroomScore * calibration.headroomFactor)
      : rawHeadroomScore,
    factors: isFirefox
      ? {
          graphicsScore: calibration.graphicsScoreFactor,
          graphicsEveryday: calibration.graphicsEverydayFactor,
          headroom: calibration.headroomFactor,
        }
      : {
          graphicsScore: 1,
          graphicsEveryday: 1,
          headroom: 1,
        },
  };
}
