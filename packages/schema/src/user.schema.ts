import { z } from 'zod';
import { UserRole, UserStatus } from './enums';
import { ModulePermissionSchema } from './permission.schema';

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
  role: z.enum([
    UserRole.ORGANIZATION,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.DONOR,
  ]),
  organizationId: z.string().uuid().optional(),
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
    phone: z.string().optional(),
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
  phone: z.string().optional().nullable().or(z.literal('')),
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ORGANIZATION]),
  permissions: z.array(ModulePermissionSchema).optional(),
});

export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;

export const CreateGeneralUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  role: z.enum([UserRole.TEACHER, UserRole.STUDENT, UserRole.DONOR]),
  organizationId: z.string().uuid().optional(),
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
  phone: z.string().optional().nullable(),
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
  guardianPhone: z.string().optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
});

export type UpdateStudentProfileInput = z.infer<
  typeof UpdateStudentProfileSchema
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
