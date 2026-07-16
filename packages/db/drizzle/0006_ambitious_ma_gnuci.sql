CREATE TABLE `merchant_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`merchant` text NOT NULL,
	`category_id` integer NOT NULL,
	`location_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_merchant_rules_user_merchant` ON `merchant_rules` (`user_id`,`merchant`);--> statement-breakpoint
CREATE TABLE `sender_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`bank_code` text NOT NULL,
	`account_last4` text DEFAULT '' NOT NULL,
	`account_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sender_accounts_user_key` ON `sender_accounts` (`user_id`,`bank_code`,`account_last4`);--> statement-breakpoint
CREATE TABLE `sms_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`sms_hash` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`received_at` integer NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`account_last4` text,
	`bank_code` text,
	`counterparty` text,
	`ref_no` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`transaction_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sms_imports_user_hash` ON `sms_imports` (`user_id`,`sms_hash`);--> statement-breakpoint
CREATE INDEX `idx_sms_imports_user_status` ON `sms_imports` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_sms_imports_received` ON `sms_imports` (`received_at`);