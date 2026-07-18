CREATE TABLE `evolution_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`expeditionId` varchar(32) NOT NULL,
	`cycleNumber` int NOT NULL,
	`zoneId` varchar(64) NOT NULL,
	`hypothesis` text NOT NULL,
	`mutation` text NOT NULL,
	`liveOracle` int NOT NULL DEFAULT 0,
	`wholenessAfter` int NOT NULL,
	`verdict` enum('keep','discard') NOT NULL DEFAULT 'keep',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evolution_cycles_id` PRIMARY KEY(`id`)
);
