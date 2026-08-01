export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return {
      shortCircuit: true,
      url: "data:text/javascript,export const env = new Proxy({}, { get(_target, key) { return globalThis.__CLOUDFLARE_TEST_ENV__?.[key]; } });",
    };
  }

  return nextResolve(specifier, context);
}
