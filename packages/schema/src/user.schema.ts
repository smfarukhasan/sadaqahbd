import { z } from 'zod';
import { UserRole, UserStatus } from './enums';
import { ModulePermissionSchema } from './permission.schema';
import { isValid11DigitPhone } from './phone.utils';

export const RegisterUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().optional().nullable().or(z.literal('')),
    phone: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine((val) => !val || isValid11DigitPhone(val), {
        message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
      }),
    address: z.string().optional().nullable().or(z.literal('')),
    role: z.enum([
      UserRole.ORGANIZATION,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.DONOR,
    ]),
    organizationId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    const role = data.role;
    if (role === UserRole.STUDENT) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'শিক্ষার্থীর পূর্ণ নাম প্রদান করা বাধ্যতামূলক।',
          path: ['fullName'],
        });
      }
      if (!data.address || data.address.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'শিক্ষার্থীর ঠিকানা প্রদান করা বাধ্যতামূলক।',
          path: ['address'],
        });
      }
    } else if (role === UserRole.DONOR) {
      if (!data.phone || !isValid11DigitPhone(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'দাতার ফোন নম্বর প্রদান করা বাধ্যতামূলক (১১ সংখ্যা, যেমন: 01XXXXXXXXX)।',
          path: ['phone'],
        });
      }
    } else {
      if (!data.fullName || data.fullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'পূর্ণ নাম / প্রতিষ্ঠানের নাম প্রদান করা বাধ্যতামূলক।',
          path: ['fullName'],
        });
      }
      if (!data.address || data.address.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ঠিকানা প্রদান করা বাধ্যতামূলক।',
          path: ['address'],
        });
      }
      if (!data.phone || !isValid11DigitPhone(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ফোন নম্বর প্রদান করা বাধ্যতামূলক (১১ সংখ্যা, যেমন: 01XXXXXXXXX)।',
          path: ['phone'],
        });
      }
    }
  });

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const SetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z
      .enum([
        UserRole.ORGANIZATION,
        UserRole.TEACHER,
        UserRole.STUDENT,
        UserRole.DONOR,
      ])
      .optional(),
    fullName: z.string().optional(),
    phone: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || isValid11DigitPhone(val), {
        message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
      }),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const CreateAdminUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || isValid11DigitPhone(val), {
      message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
    }),
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ORGANIZATION]),
  permissions: z.array(ModulePermissionSchema).optional(),
});

export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;

export const CreateGeneralUserSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine((val) => !val || isValid11DigitPhone(val), {
        message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 017XXXXXXXX)।',
      }),
    role: z.enum([UserRole.TEACHER, UserRole.STUDENT, UserRole.DONOR]),
    organizationId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== UserRole.STUDENT && (!data.phone || data.phone.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ফোন নম্বর প্রদান করা বাধ্যতামূলক।',
        path: ['phone'],
      });
    }
  });

export type CreateGeneralUserInput = z.infer<typeof CreateGeneralUserSchema>;

export const StudentVerificationProfileSchema = z.object({
  address: z.string().min(5, 'Full address is required'),
  institutionName: z.string().min(2, 'Educational institution is required'),
  studentClassRoll: z.string().min(1, 'Class or Roll is required'),
  nidOrBirthCertificateNumber: z.string().min(6, 'NID or Birth Certificate number is required'),
  nidOrBirthCertificateUrl: z.string().url('Document image/pdf URL is required'),
  photoUrl: z.string().url('Recent photo URL is required'),
});

export type StudentVerificationProfileInput = z.infer<
  typeof StudentVerificationProfileSchema
>;

export const UpdateStudentProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || isValid11DigitPhone(val), {
      message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
    }),
  address: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  className: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  nidOrBirthCertificateNumber: z.string().optional().nullable(),
  presentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianRelationship: z.string().optional().nullable(),
  guardianPhone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || isValid11DigitPhone(val), {
      message: 'অভিভাবকের ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
    }),
  guardianAddress: z.string().optional().nullable(),
});

export type UpdateStudentProfileInput = z.infer<
  typeof UpdateStudentProfileSchema
>;

export const StudentVerificationSubmissionSchema = z.object({
  fullName: z.string().min(2, 'শিক্ষার্থীর পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  fatherName: z.string().min(2, 'পিতার নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  dateOfBirth: z.string().min(4, 'জন্ম তারিখ আবশ্যক'),
  bloodGroup: z.string().min(1, 'রক্তের গ্রুপ নির্বাচন করুন'),
  nidOrBirthCertificateNumber: z.string().min(5, 'এনআইডি বা জন্মনিবন্ধন নম্বর আবশ্যক'),
  presentAddress: z.string().min(3, 'বর্তমান ঠিকানা আবশ্যক'),
  permanentAddress: z.string().min(3, 'স্থায়ী ঠিকানা আবশ্যক'),
  guardianName: z.string().min(2, 'অভিভাবকের নাম আবশ্যক'),
  guardianRelationship: z.string().min(2, 'অভিভাবকের সাথে সম্পর্ক আবশ্যক'),
  guardianPhone: z
    .string()
    .min(11, 'অভিভাবকের ফোন নম্বর আবশ্যক')
    .refine((val) => isValid11DigitPhone(val), {
      message: 'অভিভাবকের ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
    }),
  guardianAddress: z.string().min(3, 'অভিভাবকের ঠিকানা আবশ্যক'),
  phoneExemptionRequested: z.boolean().default(false),
  phoneExemptionReason: z.string().optional().nullable(),
});

export type StudentVerificationSubmissionInput = z.infer<
  typeof StudentVerificationSubmissionSchema
>;

export const SyncProfileSchema = z.object({
  role: z
    .enum([
      UserRole.MASTER_ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.ORGANIZATION,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.DONOR,
    ])
    .optional(),
});

export type SyncProfileInput = z.infer<typeof SyncProfileSchema>;

export const LocalLoginSchema = z.object({
  identifier: z.string().min(1, 'ইমেইল বা ফোন নম্বর প্রয়োজন'),
  password: z.string().min(1, 'পাসওয়ার্ড প্রদান করুন'),
});

export type LocalLoginInput = z.infer<typeof LocalLoginSchema>;

export const LocalRegisterSchema = z
  .object({
    email: z.string().email('বৈধ ইমেইল এড্রেস প্রদান করুন'),
    password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
    fullName: z.string().optional().nullable().or(z.literal('')),
    phone: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine((val) => !val || isValid11DigitPhone(val), {
        message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
      }),
    address: z.string().optional().nullable().or(z.literal('')),
    role: z
      .enum([
        UserRole.ORGANIZATION,
        UserRole.TEACHER,
        UserRole.STUDENT,
        UserRole.DONOR,
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    const role = data.role;
    // Student: fullName & address mandatory, phone optional
    if (role === UserRole.STUDENT) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'শিক্ষার্থীর পূর্ণ নাম প্রদান করা বাধ্যতামূলক।',
          path: ['fullName'],
        });
      }
      if (!data.address || data.address.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'শিক্ষার্থীর ঠিকানা প্রদান করা বাধ্যতামূলক।',
          path: ['address'],
        });
      }
    }
    // Donor: phone mandatory, fullName optional (defaults to 'দাতা'), address optional
    else if (role === UserRole.DONOR) {
      if (!data.phone || !isValid11DigitPhone(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'দাতার ফোন নম্বর প্রদান করা বাধ্যতামূলক (১১ সংখ্যা, যেমন: 01XXXXXXXXX)।',
          path: ['phone'],
        });
      }
    }
    // Teacher & Organization: all fields mandatory
    else if (role === UserRole.TEACHER || role === UserRole.ORGANIZATION) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'পূর্ণ নাম / প্রতিষ্ঠানের নাম প্রদান করা বাধ্যতামূলক।',
          path: ['fullName'],
        });
      }
      if (!data.address || data.address.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ঠিকানা প্রদান করা বাধ্যতামূলক।',
          path: ['address'],
        });
      }
      if (!data.phone || !isValid11DigitPhone(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ফোন নম্বর প্রদান করা বাধ্যতামূলক (১১ সংখ্যা, যেমন: 01XXXXXXXXX)।',
          path: ['phone'],
        });
      }
    }
  });

export type LocalRegisterInput = z.infer<typeof LocalRegisterSchema>;

