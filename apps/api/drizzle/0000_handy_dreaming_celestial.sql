CREATE TABLE `complaints` (
	`id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`admin_reply` text,
	`replied_by` varchar(36),
	`replied_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `donations` (
	`id` varchar(36) NOT NULL,
	`donor_id` varchar(36),
	`post_id` varchar(36),
	`is_random` boolean NOT NULL DEFAULT false,
	`amount` decimal(12,2) NOT NULL,
	`payment_method` varchar(50) NOT NULL,
	`transaction_reference` varchar(255) NOT NULL,
	`donor_note` text,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`rejection_reason` text,
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `donations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fund_allocations` (
	`id` varchar(36) NOT NULL,
	`student_post_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`allocated_by` varchar(36) NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fund_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`registration_number` varchar(100),
	`contact_person` varchar(150) NOT NULL,
	`contact_phone` varchar(20) NOT NULL,
	`address` text NOT NULL,
	`document_url` text,
	`status` enum('pending','active','rejected') NOT NULL DEFAULT 'pending',
	`verified_by` varchar(36),
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_post_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` varchar(36) NOT NULL,
	`category_name` varchar(100) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	CONSTRAINT `student_post_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_posts` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`problem_description` text NOT NULL,
	`total_required_amount` decimal(12,2) NOT NULL,
	`received_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`remaining_amount` decimal(12,2) NOT NULL,
	`verification_status` enum('pending_org','pending_super_admin','approved','rejected') NOT NULL DEFAULT 'pending_org',
	`is_teacher_verified` boolean NOT NULL DEFAULT false,
	`teacher_verified_by` varchar(36),
	`is_org_verified` boolean NOT NULL DEFAULT false,
	`org_verified_by` varchar(36),
	`is_double_verified` boolean NOT NULL DEFAULT false,
	`super_admin_approved_by` varchar(36),
	`rejection_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `student_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`address` text NOT NULL,
	`institution_name` varchar(255) NOT NULL,
	`student_class_roll` varchar(100) NOT NULL,
	`nid_birth_number` varchar(100) NOT NULL,
	`nid_birth_url` text NOT NULL,
	`photo_url` text NOT NULL,
	`verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`verified_by_org_user_id` varchar(36),
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`module_key` varchar(100) NOT NULL,
	`can_view` boolean NOT NULL DEFAULT false,
	`can_edit` boolean NOT NULL DEFAULT false,
	`can_delete` boolean NOT NULL DEFAULT false,
	`can_approve` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_module_perm_idx` UNIQUE(`user_id`,`module_key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`firebase_uid` varchar(128) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`full_name` varchar(150) NOT NULL,
	`role` enum('master_admin','super_admin','admin','organization','teacher','student','donor') NOT NULL,
	`organization_id` varchar(36),
	`status` enum('pending','active','suspended','rejected') NOT NULL DEFAULT 'active',
	`is_password_set` boolean NOT NULL DEFAULT false,
	`must_change_password` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_firebase_uid_unique` UNIQUE(`firebase_uid`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `user_firebase_uid_idx` UNIQUE(`firebase_uid`),
	CONSTRAINT `user_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_replied_by_users_id_fk` FOREIGN KEY (`replied_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `donations` ADD CONSTRAINT `donations_donor_id_users_id_fk` FOREIGN KEY (`donor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `donations` ADD CONSTRAINT `donations_post_id_student_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `student_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `donations` ADD CONSTRAINT `donations_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fund_allocations` ADD CONSTRAINT `fund_allocations_student_post_id_student_posts_id_fk` FOREIGN KEY (`student_post_id`) REFERENCES `student_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fund_allocations` ADD CONSTRAINT `fund_allocations_allocated_by_users_id_fk` FOREIGN KEY (`allocated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_post_expenses` ADD CONSTRAINT `student_post_expenses_post_id_student_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `student_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_posts` ADD CONSTRAINT `student_posts_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_posts` ADD CONSTRAINT `student_posts_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `complaint_status_idx` ON `complaints` (`status`);--> statement-breakpoint
CREATE INDEX `complaint_sender_idx` ON `complaints` (`sender_id`);--> statement-breakpoint
CREATE INDEX `donation_status_idx` ON `donations` (`status`);--> statement-breakpoint
CREATE INDEX `donation_donor_idx` ON `donations` (`donor_id`);--> statement-breakpoint
CREATE INDEX `donation_post_idx` ON `donations` (`post_id`);--> statement-breakpoint
CREATE INDEX `donation_random_idx` ON `donations` (`is_random`);--> statement-breakpoint
CREATE INDEX `alloc_post_idx` ON `fund_allocations` (`student_post_id`);--> statement-breakpoint
CREATE INDEX `alloc_by_idx` ON `fund_allocations` (`allocated_by`);--> statement-breakpoint
CREATE INDEX `org_status_idx` ON `organizations` (`status`);--> statement-breakpoint
CREATE INDEX `org_name_idx` ON `organizations` (`name`);--> statement-breakpoint
CREATE INDEX `expense_post_idx` ON `student_post_expenses` (`post_id`);--> statement-breakpoint
CREATE INDEX `post_status_idx` ON `student_posts` (`verification_status`);--> statement-breakpoint
CREATE INDEX `post_student_idx` ON `student_posts` (`student_id`);--> statement-breakpoint
CREATE INDEX `post_org_idx` ON `student_posts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `student_profile_status_idx` ON `student_profiles` (`verification_status`);--> statement-breakpoint
CREATE INDEX `perm_user_idx` ON `user_permissions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `user_org_idx` ON `users` (`organization_id`);