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

export const CreateItemDonationSchema = z
  .object({
    itemName: z.string().min(2, 'Item name is required'),
    description: z.string().min(5, 'Item description is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    isRandom: z.boolean().default(false),
    postId: z.string().uuid().optional(),
    donorPhone: z.string().min(6, 'Donor phone is required'),
    pickupAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isRandom && !data.postId) {
        return false;
      }
      return true;
    },
    {
      message: 'Post ID is required for direct student item donations',
      path: ['postId'],
    }
  );

export type CreateItemDonationInput = z.infer<typeof CreateItemDonationSchema>;

export const ReviewItemDonationSchema = z.object({
  itemDonationId: z.string().uuid(),
  status: z.enum([DonationStatus.ACCEPTED, DonationStatus.REJECTED]),
  adminInstruction: z.string().min(3, 'Admin instruction/reason is required'),
});

export type ReviewItemDonationInput = z.infer<typeof ReviewItemDonationSchema>;

export const DonorShipItemDonationSchema = z.object({
  itemDonationId: z.string().uuid(),
  shipmentNote: z.string().min(2, 'Shipment or dispatch note is required'),
});

export type DonorShipItemDonationInput = z.infer<
  typeof DonorShipItemDonationSchema
>;

export const AdminFollowUpItemDonationSchema = z.object({
  itemDonationId: z.string().uuid(),
  adminReply: z.string().optional(),
  assignedStudentId: z.string().uuid().optional(),
  deliveryStatus: z
    .enum(['instruction_given', 'shipped_by_donor', 'received', 'delivered_to_student'])
    .optional(),
});

export type AdminFollowUpItemDonationInput = z.infer<
  typeof AdminFollowUpItemDonationSchema
>;

