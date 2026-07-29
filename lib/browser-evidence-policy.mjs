/**
 * Browser treatment policy for the computer grade.
 *
 * StillGood keeps real browser-visible differences in the Web Experience
 * evidence. The Resource Resilience group uses equal-work compatibility
 * adapters only. No browser receives a name-based multiplier, offset, cap
 * exemption, or threshold change.
 */
export const browserEvidenceProfile = Object.freeze({
  version: "browser-evidence-v1.0",
  referenceBrowser: "chromium",
  postScoreNormalization: false,
  webExperience: Object.freeze({
    preserveBrowserDifferences: true,
    categories: Object.freeze([
      "browsing",
      "email",
      "writing",
      "spreadsheets",
      "multitasking",
      "graphics",
      "video",
      "responsiveness",
      "headroom",
    ]),
  }),
  resourceResilience: Object.freeze({
    preserveBrowserDifferences: false,
    treatment: "equal-work-adapters-only",
    categories: Object.freeze(["memory", "storage", "recovery"]),
  }),
});

export function browserSupportStatus(browserFamily) {
  if (browserFamily === "firefox") {
    return {
      level: "experimental",
      label: "Experimental Firefox support",
      detail:
        "Web Experience reflects Firefox as measured. Resource Resilience uses equal-work compatibility methods without a Firefox score adjustment.",
    };
  }
  if (browserFamily === "chromium") {
    return {
      level: "reference",
      label: "Reference browser",
      detail:
        "Chromium is StillGood's most thoroughly validated browser path.",
    };
  }
  return {
    level: "unvalidated",
    label: "Limited validation",
    detail:
      "This browser is measured without a score adjustment, but has not yet received the same physical-device validation.",
  };
}
