import { readFile } from "node:fs/promises";

const config = await readFile(
  new URL("../wrangler.public.jsonc", import.meta.url),
  "utf8",
);

if (config.includes("00000000-0000-4000-8000-000000000000")) {
  console.error(
    "Cloudflare setup is incomplete: replace the placeholder D1 database_id in wrangler.public.jsonc with the ID returned by `npx wrangler d1 create stillgood-telemetry`.",
  );
  process.exitCode = 1;
} else {
  console.log("Cloudflare production configuration is complete.");
}
