CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`recipient_user_id` varchar(36),
	`recipient_role` enum('master_admin','super_admin','admin','organization','teacher','student','donor'),
	`recipient_org_id` varchar(36),
	`title_bn` varchar(255) NOT NULL,
	`title_en` varchar(255) NOT NULL,
	`message_bn` text NOT NULL,
	`message_en` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`link` varchar(255),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`department` varchar(100),
	`designation` varchar(100),
	`employee_id` varchar(50),
	`verification_status` enum('pending','pending_org','pending_admin','verified','rejected') NOT NULL DEFAULT 'pending_org',
	`org_approved_by` varchar(36),
	`org_approved_at` timestamp,
	`admin_approved_by` varchar(36),
	`admin_approved_at` timestamp,
	`rejection_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `nid_birth_number` varchar(100);--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `nid_birth_url` text;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `photo_url` text;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `verification_status` enum('pending','pending_org','pending_admin','verified','rejected') NOT NULL DEFAULT 'pending_org';--> statement-breakpoint
ALTER TABLE `organizations` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `type` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `description` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `is_requested_by_member` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `requested_by_user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `admin_modification_reason` text;--> statement-breakpoint
ALTER TABLE `student_posts` ADD `student_full_name` varchar(150);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `student_class_department` varchar(100);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `father_name` varchar(150);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `address` text;--> statement-breakpoint
ALTER TABLE `student_posts` ADD `start_date` varchar(20);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `end_date` varchar(20);--> statement-breakpoint
ALTER TABLE `student_posts` ADD `duration_text` varchar(100);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `organization_id` varchar(36);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `father_name` varchar(150);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `class_name` varchar(100);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `roll_number` varchar(100);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `date_of_birth` varchar(30);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `blood_group` varchar(10);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `present_address` text;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `permanent_address` text;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `guardian_name` varchar(150);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `guardian_relationship` varchar(100);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `guardian_phone` varchar(30);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `guardian_address` text;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `org_approved_by` varchar(36);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `org_approved_at` timestamp;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `admin_approved_by` varchar(36);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `admin_approved_at` timestamp;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `user_phone_idx` UNIQUE(`phone`);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_user_id_users_id_fk` FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_org_id_organizations_id_fk` FOREIGN KEY (`recipient_org_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notif_recipient_user_idx` ON `notifications` (`recipient_user_id`);--> statement-breakpoint
CREATE INDEX `notif_recipient_role_idx` ON `notifications` (`recipient_role`);--> statement-breakpoint
CREATE INDEX `notif_recipient_org_idx` ON `notifications` (`recipient_org_id`);--> statement-breakpoint
CREATE INDEX `notif_read_idx` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `teacher_profile_status_idx` ON `teacher_profiles` (`verification_status`);--> statement-breakpoint
CREATE INDEX `teacher_profile_org_idx` ON `teacher_profiles` (`organization_id`);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `student_profile_org_idx` ON `student_profiles` (`organization_id`);