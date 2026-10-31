CREATE TABLE `whatsapp_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`edition` text,
	`article_id` integer,
	`body` text NOT NULL,
	`posted_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_posts_briefing_idx` ON `whatsapp_posts` (`edition`) WHERE "whatsapp_posts"."kind" = 'briefing';--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_posts_breaking_idx` ON `whatsapp_posts` (`article_id`) WHERE "whatsapp_posts"."kind" = 'breaking';--> statement-breakpoint
CREATE INDEX `whatsapp_posts_created_idx` ON `whatsapp_posts` (`created_at`);