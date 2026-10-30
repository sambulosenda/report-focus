CREATE TABLE `live_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`author_id` integer,
	`title` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `live_updates_article_idx` ON `live_updates` (`article_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `newsletter_signups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`list` text DEFAULT 'morning-focus' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_signups_email_list_idx` ON `newsletter_signups` (`email`,`list`);--> statement-breakpoint
ALTER TABLE `articles` ADD `hero_credit` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `hero_alt` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `kind` text DEFAULT 'news' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `video_url` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `video_duration` text;