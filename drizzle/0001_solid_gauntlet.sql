CREATE TABLE `memorial_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(16) NOT NULL,
	`title` varchar(255) NOT NULL,
	`dedication` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memorial_tracks_id` PRIMARY KEY(`id`)
);
