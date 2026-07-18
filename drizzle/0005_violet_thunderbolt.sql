CREATE TABLE `wizards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(40) NOT NULL,
	`name` varchar(80) NOT NULL,
	`triad` enum('b9','p9','j9') NOT NULL,
	`seat` enum('anchor','weaver','herald') NOT NULL,
	`disposition` varchar(120) NOT NULL,
	`flavor` text NOT NULL,
	`promptFlavor` text NOT NULL,
	`emoji` varchar(8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wizards_id` PRIMARY KEY(`id`),
	CONSTRAINT `wizards_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `evolution_cycles` ADD `systemOrdinal` int DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `evolution_cycles` ADD `wizardKey` varchar(40);