import { z } from 'zod';
import { ComplaintStatus } from './enums';

export const CreateComplaintSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(15, 'Message must be at least 15 characters'),
});

export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

export const ReplyComplaintSchema = z.object({
  complaintId: z.string().uuid(),
  adminReply: z.string().min(5, 'Reply message is required'),
  status: z.enum([ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]),
});

export type ReplyComplaintInput = z.infer<typeof ReplyComplaintSchema>;
