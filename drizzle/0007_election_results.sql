CREATE TABLE `election_result_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`result_id` integer NOT NULL,
	`data` text NOT NULL,
	`published` integer NOT NULL,
	`revision` integer NOT NULL,
	`editor_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`result_id`) REFERENCES `election_results`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `election_history_result_idx` ON `election_result_history` (`result_id`,`revision`);--> statement-breakpoint
CREATE TABLE `election_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`municipality_code` text NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_by` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `election_results_municipality_code_unique` ON `election_results` (`municipality_code`);