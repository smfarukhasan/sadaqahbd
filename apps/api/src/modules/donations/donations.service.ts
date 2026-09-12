import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../database/database.module';
import {
  DrizzleDB,
  donations,
  studentPosts,
  fundAllocations,
  users,
} from '../../database';
import { eq, and, sql, desc } from 'drizzle-orm';
import {
  CreateDonationInput,
  ReviewDonationInput,
  AllocateFundInput,
  DonationStatus,
  UserRole,
} from '@sadaqahbd/schema';

@Injectable()
export class DonationsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async submitDonation(donorUser: any, input: CreateDonationInput) {
    if (!input.isRandom && !input.postId) {
      throw new BadRequestException('Direct donation requires student post ID');
    }

    // If directed to a post, check post validity
    if (input.postId) {
      const post = await this.db
        .select()
        .from(studentPosts)
        .where(eq(studentPosts.id, input.postId))
        .limit(1);

      if (post.length === 0) {
        throw new NotFoundException('Target student post not found');
      }
    }

    const donationId = crypto.randomUUID();

    await this.db.insert(donations).values({
      id: donationId,
      donorId: donorUser ? donorUser.id : null,
      postId: input.isRandom ? null : input.postId,
      isRandom: input.isRandom,
      amount: input.amount.toFixed(2),
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference,
      donorNote: input.donorNote,
      status: DonationStatus.PENDING,
    });

    return {
      success: true,
      message: 'Donation submitted successfully. Pending admin review.',
      donationId,
    };
  }

  async reviewDonation(reviewer: any, input: ReviewDonationInput) {
    // Only Master Admin or Super Admin with accounts permission can review
    if (
      reviewer.role !== UserRole.MASTER_ADMIN &&
      reviewer.role !== UserRole.SUPER_ADMIN
    ) {
      const hasPerm = reviewer.permissions?.some(
        (p: any) =>
          p.moduleKey === 'accounts_management.donation_approval' &&
          p.canApprove
      );
      if (!hasPerm) {
        throw new ForbiddenException(
          'You do not have permission to approve/reject donations'
        );
      }
    }

    const targetDonation = await this.db
      .select()
      .from(donations)
      .where(eq(donations.id, input.donationId))
      .limit(1);

    if (targetDonation.length === 0) {
      throw new NotFoundException('Donation not found');
    }

    const donation = targetDonation[0];

    if (donation.status !== DonationStatus.PENDING) {
      throw new BadRequestException('This donation has already been reviewed');
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(donations)
        .set({
          status: input.status,
          rejectionReason: input.rejectionReason,
          reviewedBy: reviewer.id,
          reviewedAt: new Date(),
        })
        .where(eq(donations.id, input.donationId));

      // If accepted and direct, update student post balance
      if (input.status === DonationStatus.ACCEPTED && donation.postId) {
        const post = await tx
          .select()
          .from(studentPosts)
          .where(eq(studentPosts.id, donation.postId))
          .limit(1);

        if (post.length > 0) {
          const currentReceived = Number(post[0].receivedAmount);
          const totalRequired = Number(post[0].totalRequiredAmount);
          const newReceived = currentReceived + Number(donation.amount);
          const newRemaining = Math.max(0, totalRequired - newReceived);

          await tx
            .update(studentPosts)
            .set({
              receivedAmount: newReceived.toFixed(2),
              remainingAmount: newRemaining.toFixed(2),
            })
            .where(eq(studentPosts.id, donation.postId));
        }
      }
    });

    return {
      success: true,
      message:
        input.status === DonationStatus.ACCEPTED
          ? 'Thank you! The donation has been accepted.'
          : 'The donation has been rejected.',
    };
  }

  async allocateRandomFund(allocator: any, input: AllocateFundInput) {
    if (
      allocator.role !== UserRole.MASTER_ADMIN &&
      allocator.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only Master Admin or Super Admin can allocate random donation funds'
      );
    }

    const post = await this.db
      .select()
      .from(studentPosts)
      .where(eq(studentPosts.id, input.studentPostId))
      .limit(1);

    if (post.length === 0) {
      throw new NotFoundException('Student post not found');
    }

    const allocationId = crypto.randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(fundAllocations).values({
        id: allocationId,
        studentPostId: input.studentPostId,
        amount: input.amount.toFixed(2),
        allocatedBy: allocator.id,
        notes: input.notes,
      });

      const currentReceived = Number(post[0].receivedAmount);
      const totalRequired = Number(post[0].totalRequiredAmount);
      const newReceived = currentReceived + input.amount;
      const newRemaining = Math.max(0, totalRequired - newReceived);

      await tx
        .update(studentPosts)
        .set({
          receivedAmount: newReceived.toFixed(2),
          remainingAmount: newRemaining.toFixed(2),
        })
        .where(eq(studentPosts.id, input.studentPostId));
    });

    return {
      success: true,
      message: 'Funds successfully allocated to the student post',
      allocationId,
    };
  }

  async getTransparencyLedgerStats() {
    // 1. Total donations accepted
    const totalDonationsResult = await this.db
      .select({
        totalAccepted: sql<string>`COALESCE(SUM(${donations.amount}), '0.00')`,
      })
      .from(donations)
      .where(eq(donations.status, DonationStatus.ACCEPTED));

    // 2. Total Random Donations accepted
    const totalRandomResult = await this.db
      .select({
        totalRandom: sql<string>`COALESCE(SUM(${donations.amount}), '0.00')`,
      })
      .from(donations)
      .where(
        and(
          eq(donations.status, DonationStatus.ACCEPTED),
          eq(donations.isRandom, true)
        )
      );

    // 3. Total Direct Donations accepted
    const totalDirectResult = await this.db
      .select({
        totalDirect: sql<string>`COALESCE(SUM(${donations.amount}), '0.00')`,
      })
      .from(donations)
      .where(
        and(
          eq(donations.status, DonationStatus.ACCEPTED),
          eq(donations.isRandom, false)
        )
      );

    // 4. Total Random Funds Allocated
    const totalAllocatedResult = await this.db
      .select({
        totalAllocated: sql<string>`COALESCE(SUM(${fundAllocations.amount}), '0.00')`,
      })
      .from(fundAllocations);

    const totalDonated = Number(totalDonationsResult[0]?.totalAccepted || 0);
    const totalRandom = Number(totalRandomResult[0]?.totalRandom || 0);
    const totalDirect = Number(totalDirectResult[0]?.totalDirect || 0);
    const totalAllocated = Number(totalAllocatedResult[0]?.totalAllocated || 0);

    // Remaining unallocated in general random fund pool
    const randomFundPoolBalance = Math.max(0, totalRandom - totalAllocated);

    // Total disbursed to students = direct donations + allocated random funds
    const totalDirectlyToStudents = totalDirect + totalAllocated;

    return {
      totalDonated,
      totalRandom,
      totalDirect,
      totalAllocated,
      randomFundPoolBalance,
      totalDirectlyToStudents,
    };
  }

  async getDonorHistory(donorUser: any) {
    const history = await this.db
      .select({
        id: donations.id,
        amount: donations.amount,
        isRandom: donations.isRandom,
        paymentMethod: donations.paymentMethod,
        transactionReference: donations.transactionReference,
        status: donations.status,
        rejectionReason: donations.rejectionReason,
        createdAt: donations.createdAt,
        postTitle: studentPosts.title,
      })
      .from(donations)
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .where(eq(donations.donorId, donorUser.id))
      .orderBy(desc(donations.createdAt));

    return history;
  }
}
