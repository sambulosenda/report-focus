-- IF NOT EXISTS: an earlier copy of this migration (numbered 0002) already created the table on some local databases.
CREATE TABLE IF NOT EXISTS `legacy_redirects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`article_id` integer,
	`category_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `legacy_redirects_path_unique` ON `legacy_redirects` (`path`);