export const UserRole = {
  MASTER_ADMIN: 'master_admin',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ORGANIZATION: 'organization',
  TEACHER: 'teacher',
  STUDENT: 'student',
  DONOR: 'donor',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

export const PostVerificationStatus = {
  PENDING_ORG: 'pending_org',
  PENDING_SUPER_ADMIN: 'pending_super_admin',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type PostVerificationStatusType =
  (typeof PostVerificationStatus)[keyof typeof PostVerificationStatus];

export const DonationStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type DonationStatusType =
  (typeof DonationStatus)[keyof typeof DonationStatus];

export const ComplaintStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;

export type ComplaintStatusType =
  (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const PermissionModuleKey = {
  SUPER_ADMIN_LIST: 'admin_users.super_admin_list',
  ADMIN_LIST: 'admin_users.admin_list',
  ORG_VERIFICATION_REQUESTS: 'admin_users.org_verification_requests',
  ORG_LIST: 'admin_users.org_list',
  TEACHER_LIST: 'org_management.teacher_list',
  STUDENT_LIST: 'org_management.student_list',
  TEACHER_VERIFICATION_REQUESTS: 'org_management.teacher_verification_requests',
  STUDENT_VERIFICATION_REQUESTS: 'org_management.student_verification_requests',
  STUDENT_POST_VERIFICATION_REQUESTS: 'org_management.student_post_verification_requests',
  DONOR_PROFILE: 'donor_management.donor_profile',
  DONATION_AMOUNT: 'donor_management.donation_amount',
  ACCOUNTS_DONATION_APPROVAL: 'accounts_management.donation_approval',
} as const;

export type PermissionModuleKeyType =
  (typeof PermissionModuleKey)[keyof typeof PermissionModuleKey];
