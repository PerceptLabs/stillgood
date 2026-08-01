# StillGood public deployment and privacy addendum

**Domain:** `stillgood.fyi`  
**Host:** Cloudflare Workers with Static Assets  
**Database:** Cloudflare D1, used only for optional anonymous measurements  
**Benchmark profile:** unchanged at v6.13

This addendum changes public operation and result storage. It does not change
the benchmark workloads, scores, grade thresholds, or browser evidence policy.

## Public product rules

- The public test requires no login or user account.
- Every completed full result is saved in IndexedDB on the device that ran it.
- The browser keeps at most 50 completed runs. The user can download individual
  JSON logs or delete the local history.
- Local history does not sync between devices and disappears when the user
  clears site data.
- Anonymous calibration sharing is visibly optional and off by default.
- The benchmark loads no ads, tracking pixels, or third-party analytics.

## Anonymous calibration schema

When a user opts in, the client constructs `stillgood-telemetry.v1`. The server
rebuilds the submission from a strict allowlist before writing it to D1.

Accepted information:

- result schema and benchmark profile versions;
- category, responsiveness, reserve, and overall scores;
- workload-tier timings, presentation delay, tails, and early-stop evidence;
- frame pacing, playback, memory, persistent-storage, and recovery measurements;
- browser family and major version;
- broad operating-system family, form factor, logical-processor bucket, and
  display-cadence bucket;
- confidence and measurement-integrity flags.

Excluded information:

- account, name, or email;
- exact timestamps from the client;
- stable browser or device identifiers;
- full user-agent, referrer, hostname, IP address, extensions, tabs, history,
  filenames, or document content.

The API creates a new random row ID for each submission. It never returns
calibration rows publicly. Cloudflare handles request metadata while delivering
and protecting the Worker, but the StillGood application does not write the
request IP address to D1.

## First Cloudflare deployment

The repository deliberately contains an all-zero D1 placeholder so a deploy
cannot silently point at the wrong database.

1. Add `stillgood.fyi` to the intended Cloudflare account and complete the
   registrar nameserver change. Wait until Cloudflare marks the zone active.
2. Authenticate Wrangler:

   ```bash
   npx wrangler login
   ```

3. Create the free D1 database:

   ```bash
   npx wrangler d1 create stillgood-telemetry
   ```

4. Copy the returned UUID into `database_id` in `wrangler.public.jsonc`, replacing the
   all-zero placeholder.
5. Create both tables. The first migration retains the legacy internal-history
   table for migration safety; the public app does not use it.

   ```bash
   npm run cloudflare:migrate
   ```

6. Build and deploy the Worker, its static assets, and both custom domains:

   ```bash
   npm run deploy:cloudflare
   ```

Cloudflare creates the custom-domain DNS records and TLS certificates. If the
apex or `www` hostname already has a CNAME, remove that conflicting record before
the custom-domain deployment.

## Git-connected deployment

After the source is in GitHub, Cloudflare Workers Builds can deploy on changes
to the production branch. Use:

- build command: `npm ci && npm run build:cloudflare`
- deploy command: `npx wrangler deploy`
- root directory: repository root
- production branch: `main`

Before enabling automatic deployment, create the D1 database, commit its real
database UUID in `wrangler.public.jsonc`, and apply migrations. The Cloudflare GitHub
installation should be limited to the StillGood repository.

## Operational checks

After each production deployment:

1. Open `https://stillgood.fyi` and confirm the page uses HTTPS.
2. Confirm `/methodology`, `/privacy`, `/robots.txt`, and `/sitemap.xml` load.
3. Run a benchmark with anonymous sharing off. Confirm the result appears in
   Saved runs after a reload and no `/api/telemetry` request is made.
4. Enable sharing, run a benchmark, and confirm `/api/telemetry` returns 204.
5. Query only aggregate counts during calibration; never publish raw rows.
6. Export JSON and print the detailed report to PDF.

## Rollback

Cloudflare Workers keeps deployment versions. A bad application deployment can
be rolled back without deleting D1. Migrations in this addendum only add a table
and indexes; they do not delete the legacy table or benchmark data.
