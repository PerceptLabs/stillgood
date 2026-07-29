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

export const compatibilityAdapterProfile = Object.freeze({
  version: "1.2",
  textSorting: "precomputed-fixed-locale-ranks",
  mediaWaiting: "measured-duration",
  scoreNormalization:
    "external-versioned-browser-profile",
});
