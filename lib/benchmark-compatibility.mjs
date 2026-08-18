/**
 * Browser-neutral adapter for sorting records by a small, repeated set of
 * user-facing labels.
 *
 * The labels are collated once during fixture setup and become deterministic
 * numeric ranks. Timed large-array sorts therefore exercise record sorting,
 * not repeated locale-service initialization. Every browser receives the same
 * locale, options, ranks, records, and workload.
 */
export function createTextSortRanker(values) {
  const collator = new Intl.Collator("en-US", {
    usage: "sort",
    sensitivity: "base",
  });
  const orderedValues = [...new Set(values)].sort(collator.compare);
  const ranks = new Map(
    orderedValues.map((value, index) => [value, index]),
  );
  return Object.freeze({
    orderedValues: Object.freeze(orderedValues),
    rankFor(value) {
      const rank = ranks.get(value);
      if (rank == null)
        throw new Error(`Text sort adapter received an unknown value: ${value}`);
      return rank;
    },
  });
}

/**
 * Choose a retained-memory ladder without treating a missing Device Memory
 * hint as evidence of a large memory pool. Mobile WebKit does not expose the
 * hint and may terminate the entire page process before JavaScript can catch
 * an allocation failure. The bounded path therefore measures responsiveness
 * inside a useful working set while leaving physical-capacity claims unknown.
 */
export function planMemoryPressureLevels({ reportedMemoryGB, formFactor }) {
  if (reportedMemoryGB === 2) {
    return Object.freeze({
      levels: Object.freeze([64, 128, 256, 384]),
      capacityProbeCapped: false,
      reason: "reported-2gb-class",
    });
  }
  if (reportedMemoryGB === 4) {
    return Object.freeze({
      levels: Object.freeze([128, 256, 512, 768]),
      capacityProbeCapped: false,
      reason: "reported-4gb-class",
    });
  }
  if (reportedMemoryGB == null && formFactor === "mobile") {
    return Object.freeze({
      levels: Object.freeze([128, 256, 384, 512]),
      capacityProbeCapped: true,
      reason: "mobile-memory-hint-unavailable",
    });
  }
  return Object.freeze({
    levels: Object.freeze([128, 256, 512, 1024, 1280, 1536]),
    capacityProbeCapped: false,
    reason:
      reportedMemoryGB === 8
        ? "reported-8gb-or-more"
        : "computer-memory-hint-unavailable",
  });
}

export const compatibilityAdapterProfile = Object.freeze({
  version: "1.3",
  textSorting: "precomputed-fixed-locale-ranks",
  mediaWaiting: "measured-duration",
  unknownMobileMemory: "bounded-retained-working-set",
  scoreNormalization:
    "external-versioned-browser-profile",
});
