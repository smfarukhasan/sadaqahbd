import { z } from 'zod';
import { PostVerificationStatus } from './enums';

export const ExpenseItemSchema = z.object({
  categoryName: z.string().min(2, 'Expense category is required'),
  amount: z.number().positive('Expense amount must be greater than 0'),
});

export type ExpenseItem = z.infer<typeof ExpenseItemSchema>;

export const CreateStudentPostSchema = z.object({
  title: z.string().min(5, 'Post title must be at least 5 characters'),
  problemDescription: z
    .string()
    .min(20, 'Problem description must be at least 20 characters'),
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
