import { z } from 'zod';
import { PostVerificationStatus } from './enums';

export const ExpenseItemSchema = z.object({
  categoryName: z.string().min(2, 'Expense category is required'),
  amount: z.number().positive('Expense amount must be greater than 0'),
});

export type ExpenseItem = z.infer<typeof ExpenseItemSchema>;

export const CreateStudentPostSchema = z.object({
  fullName: z.string().optional(),
  classDepartment: z.string().optional(),
  fatherName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationText: z.string().optional(),
  title: z.string().min(5, 'Post title must be at least 5 characters'),
  problemDescription: z
    .string()
    .min(10, 'Problem description must be at least 10 characters'),
  expenses: z
    .array(ExpenseItemSchema)
    .min(1, 'At least one expense item is required'),
});

export type CreateStudentPostInput = z.infer<typeof CreateStudentPostSchema>;

export const VerifyPostSchema = z.object({
  status: z.enum([
    PostVerificationStatus.APPROVED,
    PostVerificationStatus.REJECTED,
  ]),
  rejectionReason: z.string().optional(),
});

export type VerifyPostInput = z.infer<typeof VerifyPostSchema>;

export const SuperAdminApprovePostSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
  modifiedExpenses: z.array(ExpenseItemSchema).optional(),
  modificationReason: z.string().optional(),
});

export type SuperAdminApprovePostInput = z.infer<typeof SuperAdminApprovePostSchema>;

