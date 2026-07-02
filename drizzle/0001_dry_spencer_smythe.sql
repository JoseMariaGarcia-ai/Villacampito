CREATE TABLE `occupiedDates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occupiedDates_id` PRIMARY KEY(`id`),
	CONSTRAINT `occupiedDates_date_unique` UNIQUE(`date`)
);
