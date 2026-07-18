CREATE TABLE `cosmic_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ordinal` int NOT NULL,
	`termCount` int NOT NULL,
	`factorization` varchar(160) NOT NULL,
	`epithet` varchar(40) NOT NULL,
	`character` text NOT NULL,
	`knowledgeBase` text NOT NULL,
	`forestExpression` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cosmic_systems_id` PRIMARY KEY(`id`),
	CONSTRAINT `cosmic_systems_ordinal_unique` UNIQUE(`ordinal`)
);
--> statement-breakpoint
CREATE TABLE `system_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`systemOrdinal` int NOT NULL,
	`featureKey` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`status` enum('live','planned') NOT NULL DEFAULT 'live',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_features_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_features_featureKey_unique` UNIQUE(`featureKey`)
);
