CREATE TABLE `skeleton_traversals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expeditionId` varchar(64) NOT NULL,
	`fromPage` varchar(24) NOT NULL,
	`toPage` varchar(24),
	`option` int,
	`kind` enum('pick','zoomOut','explore','divination') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skeleton_traversals_id` PRIMARY KEY(`id`)
);
