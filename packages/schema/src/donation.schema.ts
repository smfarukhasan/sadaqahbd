import { z } from 'zod';
import { DonationStatus } from './enums';

export const CreateDonationSchema = z
  .object({
    amount: z.number().positive('Donation amount must be greater than 0'),
    isRandom: z.boolean().default(false),
    postId: z.string().uuid().optional(),
    paymentMethod: z.string().min(2, 'Payment method is required'),
    transactionReference: z.string().min(3, 'Transaction reference/ID is required'),
    donorNote: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isRandom && !data.postId) {
        return false;
      }
      return true;
    },
    {
      message: 'Post ID is required for direct donations',
      path: ['postId'],
    }
  );

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

export const ReviewDonationSchema = z
  .object({
    donationId: z.string().uuid(),
    status: z.enum([DonationStatus.ACCEPTED, DonationStatus.REJECTED]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === DonationStatus.REJECTED && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when declining a donation',
      path: ['rejectionReason'],
    }
  );

export type ReviewDonationInput = z.infer<typeof ReviewDonationSchema>;

export const AllocateFundSchema = z.object({
  studentPostId: z.string().uuid(),
  amount: z.number().positive('Allocation amount must be greater than 0'),
  notes: z.string().optional(),
});

export type AllocateFundInput = z.infer<typeof AllocateFundSchema>;
