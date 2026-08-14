CREATE TABLE `freezer_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`frozen_on` text NOT NULL,
	`use_within_days` integer DEFAULT 90 NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`category` text DEFAULT 'Other' NOT NULL,
	`image_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
