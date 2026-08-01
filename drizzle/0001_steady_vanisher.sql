CREATE TABLE `anonymous_benchmark_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`telemetry_version` text NOT NULL,
	`result_schema_version` text NOT NULL,
	`profile_version` text NOT NULL,
	`browser_family` text NOT NULL,
	`browser_major` text,
	`platform_family` text NOT NULL,
	`form_factor` text NOT NULL,
	`logical_processors_bucket` text NOT NULL,
	`display_cadence_bucket` text NOT NULL,
	`grade` text NOT NULL,
	`score` integer NOT NULL,
	`confidence` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `anonymous_runs_created_idx` ON `anonymous_benchmark_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `anonymous_runs_profile_browser_idx` ON `anonymous_benchmark_runs` (`profile_version`,`browser_family`);