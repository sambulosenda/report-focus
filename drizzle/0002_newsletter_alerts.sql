CREATE TABLE `email_sends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list` text NOT NULL,
	`article_id` integer,
	`edition` text,
	`subject` text NOT NULL,
	`recipients` integer DEFAULT 0 NOT NULL,
	`sent_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `email_sends_list_idx` ON `email_sends` (`list`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_sends_alert_idx` ON `email_sends` (`list`,`article_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_sends_edition_idx` ON `email_sends` (`list`,`edition`);--> statement-breakpoint
-- SQLite can't add a column with a random default, so the sign-ups table is rebuilt. Existing sign-ups count as confirmed.
CREATE TABLE `__new_newsletter_signups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`list` text DEFAULT 'morning-focus' NOT NULL,
	`token` text DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`confirmed_at` integer,
	`unsubscribed_at` integer,
	`confirm_sent_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_newsletter_signups`(`id`, `email`, `list`, `confirmed_at`, `created_at`) SELECT `id`, `email`, `list`, `created_at`, `created_at` FROM `newsletter_signups`;--> statement-breakpoint
DROP TABLE `newsletter_signups`;--> statement-breakpoint
ALTER TABLE `__new_newsletter_signups` RENAME TO `newsletter_signups`;--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_signups_email_list_idx` ON `newsletter_signups` (`email`,`list`);--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_signups_token_idx` ON `newsletter_signups` (`token`);
