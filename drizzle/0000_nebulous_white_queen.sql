CREATE TABLE `benchmark_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`started_at` text NOT NULL,
	`schema_version` text NOT NULL,
	`profile_version` text NOT NULL,
	`grade` text NOT NULL,
	`score` integer NOT NULL,
	`confidence` text NOT NULL,
	`browser` text NOT NULL,
	`platform` text NOT NULL,
	`logical_processors` integer,
	`elapsed_ms` integer NOT NULL,
	`responsiveness_label` text NOT NULL,
	`responsiveness_score` integer,
	`headroom_label` text NOT NULL,
	`headroom_score` integer NOT NULL,
	`result_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `benchmark_runs_user_created_idx` ON `benchmark_runs` (`user_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `benchmark_runs_user_started_idx` ON `benchmark_runs` (`user_email`,`started_at`);