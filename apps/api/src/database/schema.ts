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
    organizationId: varchar('organization_id', { length: 36 })
      .notNull()
      .references(() => organizations.id),
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
    index('notif_read_idx').on(table.isRead),
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
