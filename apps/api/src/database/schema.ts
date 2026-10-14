import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
  int,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// 1. Organizations Table
// ----------------------------------------------------
export const organizations = mysqlTable(
  'organizations',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    registrationNumber: varchar('registration_number', { length: 100 }),
    contactPerson: varchar('contact_person', { length: 150 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    type: varchar('type', { length: 100 }),
    description: text('description'),
    address: text('address').notNull(),
    documentUrl: text('document_url'),
    status: mysqlEnum('status', ['pending', 'active', 'rejected'])
      .default('pending')
      .notNull(),
    isRequestedByMember: boolean('is_requested_by_member').default(false).notNull(),
    requestedByUserId: varchar('requested_by_user_id', { length: 36 }),
    verifiedBy: varchar('verified_by', { length: 36 }),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('org_status_idx').on(table.status),
    index('org_name_idx').on(table.name),
    index('org_status_created_idx').on(table.status, table.createdAt),
    index('org_req_user_idx').on(table.requestedByUserId),
  ]
);

// ----------------------------------------------------
// 2. Users Table
// ----------------------------------------------------
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    firebaseUid: varchar('firebase_uid', { length: 128 }).unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    address: text('address'),
    avatarUrl: text('avatar_url'),
    role: mysqlEnum('role', [
      'master_admin',
      'super_admin',
      'admin',
      'organization',
      'teacher',
      'student',
      'donor',
    ]).notNull(),
    organizationId: varchar('organization_id', { length: 36 }).references(
      () => organizations.id
    ),
    status: mysqlEnum('status', ['pending', 'active', 'suspended', 'rejected'])
      .default('active')
      .notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    isPasswordSet: boolean('is_password_set').default(false).notNull(),
    mustChangePassword: boolean('must_change_password')
      .default(false)
      .notNull(),
    isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
    secondaryPhone: varchar('secondary_phone', { length: 20 }),
    isSecondaryPhoneVerified: boolean('is_secondary_phone_verified').default(false).notNull(),
    phoneExemptionValidUntil: timestamp('phone_exemption_valid_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('user_firebase_uid_idx').on(table.firebaseUid),
    uniqueIndex('user_email_idx').on(table.email),
    uniqueIndex('user_phone_idx').on(table.phone),
    index('user_role_idx').on(table.role),
    index('user_org_idx').on(table.organizationId),
    index('user_role_status_idx').on(table.role, table.status),
    index('user_secondary_phone_idx').on(table.secondaryPhone),
  ]
);

// ----------------------------------------------------
// 3. User Permissions Table (Granular RBAC)
// ----------------------------------------------------
export const userPermissions = mysqlTable(
  'user_permissions',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    moduleKey: varchar('module_key', { length: 100 }).notNull(),
    canView: boolean('can_view').default(false).notNull(),
    canEdit: boolean('can_edit').default(false).notNull(),
    canDelete: boolean('can_delete').default(false).notNull(),
    canApprove: boolean('can_approve').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_module_perm_idx').on(table.userId, table.moduleKey),
    index('perm_user_idx').on(table.userId),
  ]
);

// ----------------------------------------------------
// 4. Student Profiles Table
// ----------------------------------------------------
export const studentProfiles = mysqlTable(
  'student_profiles',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: varchar('organization_id', { length: 36 })
      .references(() => organizations.id),
    address: text('address').notNull(),
    institutionName: varchar('institution_name', { length: 255 }).notNull(),
    studentClassRoll: varchar('student_class_roll', { length: 100 }).notNull(),
    fatherName: varchar('father_name', { length: 150 }),
    className: varchar('class_name', { length: 100 }),
    department: varchar('department', { length: 100 }),
    rollNumber: varchar('roll_number', { length: 100 }),
    dateOfBirth: varchar('date_of_birth', { length: 30 }),
    bloodGroup: varchar('blood_group', { length: 10 }),
    presentAddress: text('present_address'),
    permanentAddress: text('permanent_address'),
    guardianName: varchar('guardian_name', { length: 150 }),
    guardianRelationship: varchar('guardian_relationship', { length: 100 }),
    guardianPhone: varchar('guardian_phone', { length: 30 }),
    guardianAddress: text('guardian_address'),
    nidOrBirthCertificateNumber: varchar('nid_birth_number', {
      length: 100,
    }),
    nidOrBirthCertificateUrl: text('nid_birth_url'),
    photoUrl: text('photo_url'),
    verificationStatus: mysqlEnum('verification_status', [
      'pending',
      'pending_org',
      'pending_admin',
      'verified',
      'rejected',
    ])
      .default('pending_org')
      .notNull(),
    orgApprovedBy: varchar('org_approved_by', { length: 36 }),
    orgApprovedAt: timestamp('org_approved_at'),
    adminApprovedBy: varchar('admin_approved_by', { length: 36 }),
    adminApprovedAt: timestamp('admin_approved_at'),
    rejectionReason: text('rejection_reason'),
    verifiedByOrgUserId: varchar('verified_by_org_user_id', { length: 36 }),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('student_profile_status_idx').on(table.verificationStatus),
    index('student_profile_org_idx').on(table.organizationId),
    index('student_profile_status_created_idx').on(table.verificationStatus, table.createdAt),
  ]
);

// ----------------------------------------------------
// 4.1 Teacher Profiles Table
// ----------------------------------------------------
export const teacherProfiles = mysqlTable(
  'teacher_profiles',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: varchar('organization_id', { length: 36 }).references(
      () => organizations.id
    ),
    department: varchar('department', { length: 100 }),
    designation: varchar('designation', { length: 100 }),
    employeeId: varchar('employee_id', { length: 50 }),
    verificationStatus: mysqlEnum('verification_status', [
      'pending',
      'pending_org',
      'pending_admin',
      'verified',
      'rejected',
    ])
      .default('pending_org')
      .notNull(),
    orgApprovedBy: varchar('org_approved_by', { length: 36 }),
    orgApprovedAt: timestamp('org_approved_at'),
    adminApprovedBy: varchar('admin_approved_by', { length: 36 }),
    adminApprovedAt: timestamp('admin_approved_at'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('teacher_profile_status_idx').on(table.verificationStatus),
    index('teacher_profile_org_idx').on(table.organizationId),
    index('teacher_profile_status_created_idx').on(table.verificationStatus, table.createdAt),
  ]
);

// ----------------------------------------------------
// 5. Student Posts Table
// ----------------------------------------------------
export const studentPosts = mysqlTable(
  'student_posts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    studentId: varchar('student_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organizations.id),
    title: varchar('title', { length: 255 }).notNull(),
    problemDescription: text('problem_description').notNull(),
    totalRequiredAmount: decimal('total_required_amount', {
      precision: 12,
      scale: 2,
    }).notNull(),
    receivedAmount: decimal('received_amount', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    remainingAmount: decimal('remaining_amount', {
      precision: 12,
      scale: 2,
    }).notNull(),
    verificationStatus: mysqlEnum('verification_status', [
      'pending_org',
      'pending_super_admin',
      'approved',
      'rejected',
    ])
      .default('pending_org')
      .notNull(),
    isTeacherVerified: boolean('is_teacher_verified').default(false).notNull(),
    teacherVerifiedBy: varchar('teacher_verified_by', { length: 36 }),
    isOrgVerified: boolean('is_org_verified').default(false).notNull(),
    orgVerifiedBy: varchar('org_verified_by', { length: 36 }),
    isDoubleVerified: boolean('is_double_verified').default(false).notNull(),
    superAdminApprovedBy: varchar('super_admin_approved_by', { length: 36 }),
    rejectionReason: text('rejection_reason'),
    adminModificationReason: text('admin_modification_reason'),
    studentFullName: varchar('student_full_name', { length: 150 }),
    studentClassDepartment: varchar('student_class_department', { length: 100 }),
    fatherName: varchar('father_name', { length: 150 }),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    startDate: varchar('start_date', { length: 20 }),
    endDate: varchar('end_date', { length: 20 }),
    durationText: varchar('duration_text', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('post_status_idx').on(table.verificationStatus),
    index('post_student_idx').on(table.studentId),
    index('post_org_idx').on(table.organizationId),
    index('post_status_created_idx').on(table.verificationStatus, table.createdAt),
    index('post_org_status_idx').on(table.organizationId, table.verificationStatus),
    index('post_student_status_idx').on(table.studentId, table.verificationStatus),
  ]
);

// ----------------------------------------------------
// 6. Student Post Expenses Table (Itemized Monthly Breakdown)
// ----------------------------------------------------
export const studentPostExpenses = mysqlTable(
  'student_post_expenses',
  {
    id: int('id').autoincrement().primaryKey(),
    postId: varchar('post_id', { length: 36 })
      .notNull()
      .references(() => studentPosts.id, { onDelete: 'cascade' }),
    categoryName: varchar('category_name', { length: 100 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index('expense_post_idx').on(table.postId)]
);

// ----------------------------------------------------
// 7. Donations Table
// ----------------------------------------------------
export const donations = mysqlTable(
  'donations',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    donorId: varchar('donor_id', { length: 36 }).references(() => users.id),
    postId: varchar('post_id', { length: 36 }).references(
      () => studentPosts.id
    ),
    isRandom: boolean('is_random').default(false).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    transactionReference: varchar('transaction_reference', {
      length: 255,
    }).notNull(),
    donorNote: text('donor_note'),
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    status: mysqlEnum('status', ['pending', 'accepted', 'rejected'])
      .default('pending')
      .notNull(),
    rejectionReason: text('rejection_reason'),
    reviewedBy: varchar('reviewed_by', { length: 36 }).references(
      () => users.id
    ),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('donation_status_idx').on(table.status),
    index('donation_donor_idx').on(table.donorId),
    index('donation_post_idx').on(table.postId),
    index('donation_random_idx').on(table.isRandom),
    index('donation_status_created_idx').on(table.status, table.createdAt),
    index('donation_donor_created_idx').on(table.donorId, table.createdAt),
    index('donation_post_status_idx').on(table.postId, table.status),
    index('donation_status_random_idx').on(table.status, table.isRandom),
  ]
);

// ----------------------------------------------------
// 7b. Item Donations Table (Non-Monetary Goods / Items)
// ----------------------------------------------------
export const itemDonations = mysqlTable(
  'item_donations',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    donorId: varchar('donor_id', { length: 36 }).references(() => users.id),
    donorName: varchar('donor_name', { length: 255 }),
    donorPhone: varchar('donor_phone', { length: 50 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    quantity: varchar('quantity', { length: 100 }).notNull(),
    isRandom: boolean('is_random').default(false).notNull(),
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    postId: varchar('post_id', { length: 36 }).references(() => studentPosts.id),
    pickupAddress: text('pickup_address'),
    status: mysqlEnum('status', ['pending', 'accepted', 'rejected'])
      .default('pending')
      .notNull(),
    adminInstruction: text('admin_instruction'),
    donorShipmentNote: text('donor_shipment_note'),
    donorShippedAt: timestamp('donor_shipped_at'),
    adminFollowUpReply: text('admin_follow_up_reply'),
    assignedStudentId: varchar('assigned_student_id', { length: 36 }).references(
      () => users.id
    ),
    deliveryStatus: varchar('delivery_status', { length: 50 })
      .default('pending_review')
      .notNull(),
    reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('item_donation_status_idx').on(table.status),
    index('item_donation_donor_idx').on(table.donorId),
    index('item_donation_post_idx').on(table.postId),
    index('item_donation_assigned_student_idx').on(table.assignedStudentId),
    index('item_donation_status_created_idx').on(table.status, table.createdAt),
    index('item_donation_donor_created_idx').on(table.donorId, table.createdAt),
  ]
);

// ----------------------------------------------------
// 8. Fund Allocations Table (Super Admin Disbursing Random Pool)
// ----------------------------------------------------
export const fundAllocations = mysqlTable(
  'fund_allocations',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    studentPostId: varchar('student_post_id', { length: 36 })
      .notNull()
      .references(() => studentPosts.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    allocatedBy: varchar('allocated_by', { length: 36 })
      .notNull()
      .references(() => users.id),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('alloc_post_idx').on(table.studentPostId),
    index('alloc_by_idx').on(table.allocatedBy),
    index('alloc_created_idx').on(table.createdAt),
  ]
);

// ----------------------------------------------------
// 9. Complaints Table
// ----------------------------------------------------
export const complaints = mysqlTable(
  'complaints',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    senderId: varchar('sender_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    subject: varchar('subject', { length: 255 }).notNull(),
    message: text('message').notNull(),
    status: mysqlEnum('status', ['open', 'in_progress', 'resolved'])
      .default('open')
      .notNull(),
    adminReply: text('admin_reply'),
    repliedBy: varchar('replied_by', { length: 36 }).references(() => users.id),
    repliedAt: timestamp('replied_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('complaint_status_idx').on(table.status),
    index('complaint_sender_idx').on(table.senderId),
    index('complaint_status_created_idx').on(table.status, table.createdAt),
  ]
);

// ----------------------------------------------------
// 10. Notifications Table
// ----------------------------------------------------
export const notifications = mysqlTable(
  'notifications',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    recipientUserId: varchar('recipient_user_id', { length: 36 }).references(
      () => users.id,
      { onDelete: 'cascade' }
    ),
    recipientRole: mysqlEnum('recipient_role', [
      'master_admin',
      'super_admin',
      'admin',
      'organization',
      'teacher',
      'student',
      'donor',
    ]),
    recipientOrgId: varchar('recipient_org_id', { length: 36 }).references(
      () => organizations.id
    ),
    requiredPermission: varchar('required_permission', { length: 100 }),
    titleBn: varchar('title_bn', { length: 255 }).notNull(),
    titleEn: varchar('title_en', { length: 255 }).notNull(),
    messageBn: text('message_bn').notNull(),
    messageEn: text('message_en').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    link: varchar('link', { length: 255 }),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notif_recipient_user_idx').on(table.recipientUserId),
    index('notif_recipient_role_idx').on(table.recipientRole),
    index('notif_recipient_org_idx').on(table.recipientOrgId),
    index('notif_required_perm_idx').on(table.requiredPermission),
    index('notif_read_idx').on(table.isRead),
    index('notif_user_read_created_idx').on(table.recipientUserId, table.isRead, table.createdAt),
    index('notif_user_created_idx').on(table.recipientUserId, table.createdAt),
    index('notif_role_created_idx').on(table.recipientRole, table.createdAt),
    index('notif_org_created_idx').on(table.recipientOrgId, table.createdAt),
  ]
);

// ----------------------------------------------------
// 11. Institution Transfers Table
// ----------------------------------------------------
export const institutionTransfers = mysqlTable(
  'institution_transfers',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userRole: mysqlEnum('user_role', ['student', 'teacher']).notNull(),
    currentOrgId: varchar('current_org_id', { length: 36 })
      .notNull()
      .references(() => organizations.id),
    targetOrgId: varchar('target_org_id', { length: 36 })
      .notNull()
      .references(() => organizations.id),
    reason: text('reason').notNull(),
    status: mysqlEnum('status', [
      'pending_current_org',
      'current_org_approved',
      'target_org_approved',
      'approved',
      'rejected',
    ])
      .default('pending_current_org')
      .notNull(),
    currentOrgApprovedBy: varchar('current_org_approved_by', { length: 36 }),
    currentOrgApprovedAt: timestamp('current_org_approved_at'),
    currentOrgRejectionReason: text('current_org_rejection_reason'),
    targetOrgApprovedBy: varchar('target_org_approved_by', { length: 36 }),
    targetOrgApprovedAt: timestamp('target_org_approved_at'),
    targetOrgRejectionReason: text('target_org_rejection_reason'),
    finalApprovedBy: varchar('final_approved_by', { length: 36 }),
    finalApprovedAt: timestamp('final_approved_at'),
    finalRejectionReason: text('final_rejection_reason'),
    rejectionStage: mysqlEnum('rejection_stage', ['current_org', 'target_org', 'admin']),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('transfer_user_idx').on(table.userId),
    index('transfer_status_idx').on(table.status),
    index('transfer_current_org_idx').on(table.currentOrgId),
    index('transfer_target_org_idx').on(table.targetOrgId),
    index('transfer_status_created_idx').on(table.status, table.createdAt),
    index('transfer_target_status_idx').on(table.targetOrgId, table.status),
    index('transfer_current_status_idx').on(table.currentOrgId, table.status),
  ]
);

// ----------------------------------------------------
// 12. Organization Member Removal Requests Table
// ----------------------------------------------------
export const orgMemberRemovals = mysqlTable(
  'org_member_removals',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organizations.id),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userRole: mysqlEnum('user_role', ['student', 'teacher']).notNull(),
    reason: text('reason').notNull(),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected'])
      .default('pending')
      .notNull(),
    requestedByUserId: varchar('requested_by_user_id', { length: 36 }).references(
      () => users.id
    ),
    adminReviewedBy: varchar('admin_reviewed_by', { length: 36 }).references(
      () => users.id
    ),
    adminReviewedAt: timestamp('admin_reviewed_at'),
    adminRejectionReason: text('admin_rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('org_removal_org_idx').on(table.organizationId),
    index('org_removal_user_idx').on(table.userId),
    index('org_removal_status_idx').on(table.status),
    index('org_removal_status_created_idx').on(table.status, table.createdAt),
  ]
);

// ----------------------------------------------------
// 13. App Maintenance Settings (Khub Soja Subscription)
// ----------------------------------------------------
export const appMaintenanceSettings = mysqlTable('app_maintenance_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  currentValidUntil: timestamp('current_valid_until').notNull(),
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).default('500.00').notNull(),
  yearlyPrice: decimal('yearly_price', { precision: 10, scale: 2 }).default('5000.00').notNull(),
  regularMonthlyPrice: decimal('regular_monthly_price', { precision: 10, scale: 2 }).default('1000.00').notNull(),
  regularYearlyPrice: decimal('regular_yearly_price', { precision: 10, scale: 2 }).default('10000.00').notNull(),
  lastWarningSmsDate: varchar('last_warning_sms_date', { length: 20 }),
  lastWarningNotifDate: varchar('last_warning_notif_date', { length: 20 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ----------------------------------------------------
// 14. App Maintenance Payments (Khub Soja Gateway History)
// ----------------------------------------------------
export const appMaintenancePayments = mysqlTable(
  'app_maintenance_payments',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    planType: varchar('plan_type', { length: 20 }).notNull(), // 'monthly' | 'yearly'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    transactionId: varchar('transaction_id', { length: 100 }).notNull().unique(),
    orderId: varchar('order_id', { length: 100 }).notNull(),
    gatewayProvider: varchar('gateway_provider', { length: 50 }).default('khubsoja').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    paidByUserId: varchar('paid_by_user_id', { length: 36 }).references(() => users.id),
    paidByName: varchar('paid_by_name', { length: 150 }),
    paidByEmail: varchar('paid_by_email', { length: 255 }),
    previousValidUntil: timestamp('previous_valid_until'),
    extendedValidUntil: timestamp('extended_valid_until'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('maint_pay_tx_idx').on(table.transactionId),
    index('maint_pay_status_idx').on(table.status),
    index('maint_pay_status_created_idx').on(table.status, table.createdAt),
  ]
);

// ----------------------------------------------------
// 15. SMS Balance & Meter
// ----------------------------------------------------
export const smsBalance = mysqlTable('sms_balance', {
  id: varchar('id', { length: 36 }).primaryKey(),
  totalCredited: int('total_credited').default(0).notNull(),
  totalUsed: int('total_used').default(0).notNull(),
  remainingSms: int('remaining_sms').default(0).notNull(),
  lastLowBalanceNotifDate: varchar('last_low_balance_notif_date', { length: 20 }),
  lastZeroBalanceSmsDate: varchar('last_zero_balance_sms_date', { length: 20 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ----------------------------------------------------
// 16. SMS Package Purchases (via Khub Soja Payment Gateway)
// ----------------------------------------------------
export const smsPackagePurchases = mysqlTable(
  'sms_package_purchases',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    packageName: varchar('package_name', { length: 100 }).notNull(),
    smsCount: int('sms_count').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    transactionId: varchar('transaction_id', { length: 100 }).notNull().unique(),
    orderId: varchar('order_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    purchasedByUserId: varchar('purchased_by_user_id', { length: 36 }).references(() => users.id),
    purchasedAt: timestamp('purchased_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sms_pkg_tx_idx').on(table.transactionId),
    index('sms_pkg_status_idx').on(table.status),
    index('sms_pkg_status_created_idx').on(table.status, table.createdAt),
  ]
);

// ----------------------------------------------------
// 17. SMS Logs (Outgoing SMS & OTP Auditing)
// ----------------------------------------------------
export const smsLogs = mysqlTable(
  'sms_logs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
    recipientUserId: varchar('recipient_user_id', { length: 36 }),
    message: text('message').notNull(),
    purpose: varchar('purpose', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    gatewayResponse: text('gateway_response'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sms_log_phone_idx').on(table.recipientPhone),
    index('sms_log_created_idx').on(table.createdAt),
    index('sms_log_phone_created_idx').on(table.recipientPhone, table.createdAt),
  ]
);

// ----------------------------------------------------
// 18. Phone OTP Verifications
// ----------------------------------------------------
export const phoneVerifications = mysqlTable(
  'phone_verifications',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 20 }).notNull(),
    otpCode: varchar('otp_code', { length: 10 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    verifiedAt: timestamp('verified_at'),
    attempts: int('attempts').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('phone_verif_user_idx').on(table.userId),
    index('phone_verif_phone_idx').on(table.phone),
    index('phone_verif_active_idx').on(table.phone, table.isVerified, table.expiresAt),
  ]
);

// ----------------------------------------------------
// 19. User Verified Phone Numbers (Max 2 per user)
// ----------------------------------------------------
export const userVerifiedPhones = mysqlTable(
  'user_verified_phones',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 20 }).notNull(),
    isPrimary: boolean('is_primary').default(true).notNull(),
    verifiedAt: timestamp('verified_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uvp_phone_idx').on(table.phone),
    index('uvp_user_idx').on(table.userId),
  ]
);

// ----------------------------------------------------
// 20. Student Phone Exemption Requests
// ----------------------------------------------------
export const studentPhoneExemptions = mysqlTable(
  'student_phone_exemptions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    studentId: varchar('student_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected'])
      .default('pending')
      .notNull(),
    validUntil: timestamp('valid_until'),
    reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('spe_student_idx').on(table.studentId),
    index('spe_status_idx').on(table.status),
    index('spe_status_created_idx').on(table.status, table.createdAt),
  ]
);

// ----------------------------------------------------
// Drizzle Relations
// ----------------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  permissions: many(userPermissions),
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  teacherProfile: one(teacherProfiles, {
    fields: [users.id],
    references: [teacherProfiles.userId],
  }),
  posts: many(studentPosts),
  donations: many(donations),
  complaints: many(complaints),
  notifications: many(notifications),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  posts: many(studentPosts),
  teachers: many(teacherProfiles),
  students: many(studentProfiles),
}));

export const studentPostsRelations = relations(
  studentPosts,
  ({ one, many }) => ({
    student: one(users, {
      fields: [studentPosts.studentId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [studentPosts.organizationId],
      references: [organizations.id],
    }),
    expenses: many(studentPostExpenses),
    donations: many(donations),
    allocations: many(fundAllocations),
  })
);

export const studentPostExpensesRelations = relations(
  studentPostExpenses,
  ({ one }) => ({
    post: one(studentPosts, {
      fields: [studentPostExpenses.postId],
      references: [studentPosts.id],
    }),
  })
);

export const donationsRelations = relations(donations, ({ one }) => ({
  donor: one(users, {
    fields: [donations.donorId],
    references: [users.id],
  }),
  post: one(studentPosts, {
    fields: [donations.postId],
    references: [studentPosts.id],
  }),
  reviewer: one(users, {
    fields: [donations.reviewedBy],
    references: [users.id],
  }),
}));

export const institutionTransfersRelations = relations(
  institutionTransfers,
  ({ one }) => ({
    user: one(users, {
      fields: [institutionTransfers.userId],
      references: [users.id],
    }),
    currentOrg: one(organizations, {
      fields: [institutionTransfers.currentOrgId],
      references: [organizations.id],
    }),
    targetOrg: one(organizations, {
      fields: [institutionTransfers.targetOrgId],
      references: [organizations.id],
    }),
  })
);
