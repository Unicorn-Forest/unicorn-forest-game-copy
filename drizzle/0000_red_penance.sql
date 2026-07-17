CREATE TABLE `field_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`zoneId` varchar(64) NOT NULL,
	`fileKey` text NOT NULL,
	`url` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(127) NOT NULL,
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `field_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_saves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`discovered` text NOT NULL,
	`artifacts` text NOT NULL,
	`allies` text NOT NULL,
	`stardust` int NOT NULL DEFAULT 3,
	`cycles` int NOT NULL DEFAULT 1,
	`finaleReached` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_saves_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_saves_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
