import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const benchmarkRuns = sqliteTable(
  "benchmark_runs",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    startedAt: text("started_at").notNull(),
    schemaVersion: text("schema_version").notNull(),
    profileVersion: text("profile_version").notNull(),
    grade: text("grade").notNull(),
    score: integer("score").notNull(),
    confidence: text("confidence").notNull(),
    browser: text("browser").notNull(),
    platform: text("platform").notNull(),
    logicalProcessors: integer("logical_processors"),
    elapsedMs: integer("elapsed_ms").notNull(),
    responsivenessLabel: text("responsiveness_label").notNull(),
    responsivenessScore: integer("responsiveness_score"),
    headroomLabel: text("headroom_label").notNull(),
    headroomScore: integer("headroom_score").notNull(),
    resultJson: text("result_json").notNull(),
  },
  (table) => [
    index("benchmark_runs_user_created_idx").on(
      table.userEmail,
      table.createdAt,
    ),
    index("benchmark_runs_user_started_idx").on(
      table.userEmail,
      table.startedAt,
    ),
  ],
);

export const anonymousBenchmarkRuns = sqliteTable(
  "anonymous_benchmark_runs",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    telemetryVersion: text("telemetry_version").notNull(),
    resultSchemaVersion: text("result_schema_version").notNull(),
    profileVersion: text("profile_version").notNull(),
    browserFamily: text("browser_family").notNull(),
    browserMajor: text("browser_major"),
    platformFamily: text("platform_family").notNull(),
    formFactor: text("form_factor").notNull(),
    logicalProcessorsBucket: text("logical_processors_bucket").notNull(),
    displayCadenceBucket: text("display_cadence_bucket").notNull(),
    grade: text("grade").notNull(),
    score: integer("score").notNull(),
    confidence: text("confidence").notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [
    index("anonymous_runs_created_idx").on(table.createdAt),
    index("anonymous_runs_profile_browser_idx").on(
      table.profileVersion,
      table.browserFamily,
    ),
  ],
);
