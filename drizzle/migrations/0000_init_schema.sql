CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`wallet_name` text NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chatrooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chatrooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_bot_message_id` integer,
	`last_user_message_id` integer,
	`register_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`messageId` integer NOT NULL,
	`category_id` integer NOT NULL,
	`wallet_id` integer NOT NULL,
	`is_success` integer NOT NULL,
	`activity` text NOT NULL,
	`date` integer NOT NULL,
	`type` text DEFAULT 'out' NOT NULL,
	`nominal` integer NOT NULL,
	`verified_at` integer,
	FOREIGN KEY (`chat_id`) REFERENCES `chatrooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`wallet_name` text NOT NULL,
	`is_default` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chatrooms`(`id`) ON UPDATE no action ON DELETE no action
);
