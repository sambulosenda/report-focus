CREATE TABLE `home_pins` (
	`slot` integer PRIMARY KEY NOT NULL,
	`article_id` integer NOT NULL,
	`expires_at` integer,
	`pinned_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pinned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `home_pins_article_idx` ON `home_pins` (`article_id`);