ALTER TABLE `transactions` ADD `contact_id` integer REFERENCES contacts(id);--> statement-breakpoint
CREATE INDEX `idx_transactions_contact` ON `transactions` (`contact_id`);