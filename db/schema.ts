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
