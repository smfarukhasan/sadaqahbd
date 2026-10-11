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
  ITEM_DONATION_APPROVAL: 'accounts_management.item_donation_approval',
  ACCOUNTS_FUND_ALLOCATION: 'accounts_management.fund_allocation',
} as const;

export type PermissionModuleKeyType =
  (typeof PermissionModuleKey)[keyof typeof PermissionModuleKey];

export const OrganizationType = {
  QAWMI_MADRASA: 'qawmi_madrasa',
  HAFEZIA_MADRASA: 'hafezia_madrasa',
  EBTEDAYEE_MADRASA: 'ebtedayee_madrasa',
  ALIA_MADRASA: 'alia_madrasa',
  ORPHANAGE: 'orphanage',
  OTHER: 'other',
} as const;

export type OrganizationTypeValue =
  (typeof OrganizationType)[keyof typeof OrganizationType];

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'qawmi_madrasa', labelBn: 'কওমি মাদ্রাসা', labelEn: 'Qawmi Madrasa' },
  { value: 'hafezia_madrasa', labelBn: 'হাফেজীয়া মাদ্রাসা', labelEn: 'Hafezia Madrasa' },
  { value: 'ebtedayee_madrasa', labelBn: 'এবতেদায়ী মাদ্রাসা', labelEn: 'Ebtedayee Madrasa' },
  { value: 'alia_madrasa', labelBn: 'আলিয়া মাদ্রাসা', labelEn: 'Alia Madrasa' },
  { value: 'orphanage', labelBn: 'এতিম খানা', labelEn: 'Orphanage' },
  { value: 'other', labelBn: 'অন্যান্য', labelEn: 'Other' },
] as const;

export function getOrganizationTypeLabel(type?: string | null, isBn = true): string {
  if (!type) return isBn ? 'অনির্দিষ্ট' : 'Unspecified';
  const match = ORGANIZATION_TYPE_OPTIONS.find((opt) => opt.value === type);
  if (match) return isBn ? match.labelBn : match.labelEn;

  // Fallbacks for legacy records
  const legacyMap: Record<string, { bn: string; en: string }> = {
    madrasa: { bn: 'মাদ্রাসা', en: 'Madrasa' },
    madrasah: { bn: 'মাদ্রাসা', en: 'Madrasa' },
    school: { bn: 'স্কুল', en: 'School' },
    college: { bn: 'কলেজ', en: 'College' },
    university: { bn: 'বিশ্ববিদ্যালয়', en: 'University' },
    technical: { bn: 'কারিগরি প্রতিষ্ঠান', en: 'Technical Institute' },
    etimkhana: { bn: 'এতিম খানা', en: 'Orphanage' },
    others: { bn: 'অন্যান্য', en: 'Other' },
  };

  const legacy = legacyMap[type.toLowerCase()];
  if (legacy) return isBn ? legacy.bn : legacy.en;

  return type;
}
