CREATE TABLE `tributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorName` varchar(80) NOT NULL,
	`message` text NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tributes_id` PRIMARY KEY(`id`)
);
