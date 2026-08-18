/**
 * Preflight optional reserve components before the paired measurement begins.
 * A component may be unavailable, but baseline and loaded observations must
 * always execute the same set of components.
 */
export async function preflightOptionalReserveComponents({ image, pdf }) {
  const available = { image: typeof image === "function", pdf: typeof pdf === "function" };
  const failures = [];

  for (const [id, operation] of [["image", image], ["pdf", pdf]]) {
    if (typeof operation !== "function") continue;
    try {
      await operation();
    } catch {
      available[id] = false;
      failures.push(id);
    }
  }

  return { available, failures };
}
