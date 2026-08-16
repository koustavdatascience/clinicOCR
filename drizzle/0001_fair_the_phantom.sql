CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`age` int,
	`gender` varchar(48),
	`phone` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`patientId` int NOT NULL,
	`imageKey` text NOT NULL,
	`imageUrl` text NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`originalMimeType` varchar(96) NOT NULL,
	`rawOcr` text NOT NULL,
	`correctedText` text NOT NULL,
	`aiSummary` text NOT NULL,
	`medicines` json NOT NULL,
	`importantFindings` json NOT NULL,
	`tags` json NOT NULL,
	`doctorNotes` text,
	`important` boolean NOT NULL DEFAULT false,
	`ocrConfidence` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `patients_owner_idx` ON `patients` (`ownerId`);--> statement-breakpoint
CREATE INDEX `patients_owner_name_idx` ON `patients` (`ownerId`,`name`);--> statement-breakpoint
CREATE INDEX `patients_owner_phone_idx` ON `patients` (`ownerId`,`phone`);--> statement-breakpoint
CREATE INDEX `prescriptions_owner_idx` ON `prescriptions` (`ownerId`);--> statement-breakpoint
CREATE INDEX `prescriptions_patient_created_idx` ON `prescriptions` (`patientId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `prescriptions_owner_created_idx` ON `prescriptions` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `prescriptions_important_idx` ON `prescriptions` (`patientId`,`important`);