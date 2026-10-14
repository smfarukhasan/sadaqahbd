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
  itemDonations,
  studentPosts,
  fundAllocations,
  users,
  organizations,
} from '../../database';
import { eq, and, sql, desc, isNull, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import {
  CreateDonationInput,
  ReviewDonationInput,
  AllocateFundInput,
  CreateItemDonationInput,
  ReviewItemDonationInput,
  DonorShipItemDonationInput,
  AdminFollowUpItemDonationInput,
  DonationStatus,
  UserRole,
  PermissionModuleKey,
} from '@sadaqahbd/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DonationsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService
  ) {}

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
      isAnonymous: input.isAnonymous ?? false,
      status: DonationStatus.PENDING,
    });

    // Notify Super Admins and Master Admin (Filtered by Permission)
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission: PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL,
      titleBn: 'নতুন অনুদান যাচাই ও অনুমোদন',
      titleEn: 'New Donation Pending Approval',
      messageBn: `৳${Number(input.amount).toLocaleString('bn-BD')} টাকার একটি নতুন অনুদান এসেছে। ট্রানজেকশন আইডি: ${input.transactionReference}`,
      messageEn: `A donation of ৳${input.amount} has been submitted (TxID: ${input.transactionReference}).`,
      type: 'donation_submitted',
      link: '/admin?tab=donation_approval',
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

    let studentIdToNotify: string | null = null;
    let postTitleToNotify: string | null = null;

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
          studentIdToNotify = post[0].studentId;
          postTitleToNotify = post[0].title;
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

    // Notify donor and student
    if (input.status === DonationStatus.ACCEPTED) {
      if (donation.donorId) {
        await this.notificationsService.createNotification({
          recipientUserId: donation.donorId,
          titleBn: 'অনুদান অনুমোদিত হয়েছে',
          titleEn: 'Donation Approved',
          messageBn: `আপনার ৳${Number(donation.amount).toLocaleString('bn-BD')} অনুদান সফলভাবে যাচাই ও অনুমোদিত হয়েছে।`,
          messageEn: `Your donation of ৳${donation.amount} has been approved.`,
          type: 'donation_accepted',
          link: '/donor',
        });
      }
      if (studentIdToNotify) {
        await this.notificationsService.createNotification({
          recipientUserId: studentIdToNotify,
          titleBn: 'নতুন অনুদান প্রাপ্তি',
          titleEn: 'New Donation Received',
          messageBn: `আপনার আবেদন "${postTitleToNotify}"-এ ৳${Number(donation.amount).toLocaleString('bn-BD')} সরাসরি অনুদান জমা হয়েছে।`,
          messageEn: `You received ৳${donation.amount} for your aid request.`,
          type: 'donation_received',
          link: `/posts/${donation.postId}`,
        });
      }
    } else if (input.status === DonationStatus.REJECTED && donation.donorId) {
      await this.notificationsService.createNotification({
        recipientUserId: donation.donorId,
        titleBn: 'অনুদান বাতিল করা হয়েছে',
        titleEn: 'Donation Rejected',
        messageBn: `আপনার অনুদান আবেদনটি বাতিল করা হয়েছে। কারণ: ${input.rejectionReason || 'তথ্যে গরমিল'}`,
        messageEn: `Your donation was rejected: ${input.rejectionReason || 'Verification failed'}`,
        type: 'donation_rejected',
        link: '/donor',
      });
    }

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
      allocator.role !== UserRole.SUPER_ADMIN &&
      allocator.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only Master Admin, Super Admin, or authorized Admin can allocate random donation funds'
      );
    }

    if (allocator.role !== UserRole.MASTER_ADMIN) {
      const hasPerm = allocator.permissions?.some(
        (p: any) =>
          (p.moduleKey === PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION ||
            p.moduleKey === 'accounts_management.fund_allocation' ||
            p.moduleKey === 'accounts_management.donation_approval') &&
          (p.canApprove || p.canEdit)
      );
      if (!hasPerm) {
        throw new ForbiddenException(
          'সাধারণ শিক্ষা তহবিল বণ্টনের জন্য আপনার পর্যাপ্ত পারমিশন নেই'
        );
      }
    }

    // Verify fund pool balance
    const stats = await this.getTransparencyLedgerStats();
    if (stats.randomFundPoolBalance < input.amount) {
      throw new BadRequestException(
        `তহবিলে পর্যাপ্ত অর্থ নেই। বর্তমান তহবিল ব্যালেন্স: ৳${stats.randomFundPoolBalance.toLocaleString('bn-BD')}`
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

    const remaining = Number(post[0].remainingAmount);
    if (input.amount > remaining) {
      throw new BadRequestException(
        `বরাদ্দের পরিমাণ শিক্ষার্থীর বাকি টাকার (৳${remaining.toLocaleString('bn-BD')}) চেয়ে বেশি হতে পারবে না`
      );
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

    // Notify student
    await this.notificationsService.createNotification({
      recipientUserId: post[0].studentId,
      titleBn: 'সাধারণ শিক্ষা তহবিল থেকে অর্থ বরাদ্দ',
      titleEn: 'Fund Allocated from General Pool',
      messageBn: `কর্তৃপক্ষ আপনার আবেদন "${post[0].title}"-এ সাধারণ শিক্ষা তহবিল থেকে ৳${input.amount.toLocaleString('bn-BD')} বরাদ্দ করেছেন।`,
      messageEn: `Admin allocated ৳${input.amount} from general fund to your campaign.`,
      type: 'fund_allocated',
      link: `/posts/${input.studentPostId}`,
    });

    return {
      success: true,
      message: 'Funds successfully allocated to the student post',
      allocationId,
    };
  }

  async getTransparencyLedgerStats() {
    // Parallel single-pass execution of donations aggregation and allocations
    const [donationsStats, totalAllocatedResult] = await Promise.all([
      this.db
        .select({
          totalAccepted: sql<string>`COALESCE(SUM(${donations.amount}), '0.00')`,
          totalRandom: sql<string>`COALESCE(SUM(CASE WHEN ${donations.isRandom} = 1 THEN ${donations.amount} ELSE 0 END), '0.00')`,
          totalDirect: sql<string>`COALESCE(SUM(CASE WHEN ${donations.isRandom} = 0 THEN ${donations.amount} ELSE 0 END), '0.00')`,
        })
        .from(donations)
        .where(eq(donations.status, DonationStatus.ACCEPTED)),
      this.db
        .select({
          totalAllocated: sql<string>`COALESCE(SUM(${fundAllocations.amount}), '0.00')`,
        })
        .from(fundAllocations),
    ]);

    const totalDonated = Number(donationsStats[0]?.totalAccepted || 0);
    const totalRandom = Number(donationsStats[0]?.totalRandom || 0);
    const totalDirect = Number(donationsStats[0]?.totalDirect || 0);
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
        isAnonymous: donations.isAnonymous,
        paymentMethod: donations.paymentMethod,
        transactionReference: donations.transactionReference,
        status: donations.status,
        rejectionReason: donations.rejectionReason,
        createdAt: donations.createdAt,
        postId: donations.postId,
        postTitle: studentPosts.title,
        studentUserId: studentPosts.studentId,
      })
      .from(donations)
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .where(eq(donations.donorId, donorUser.id))
      .orderBy(desc(donations.createdAt));

    return history;
  }

  async toggleDonationPrivacy(donorUser: any, donationId: string, isAnonymous: boolean) {
    const donation = await this.db
      .select()
      .from(donations)
      .where(and(eq(donations.id, donationId), eq(donations.donorId, donorUser.id)))
      .limit(1);

    if (donation.length === 0) {
      throw new NotFoundException('Donation record not found or not owned by you');
    }

    await this.db
      .update(donations)
      .set({ isAnonymous: !!isAnonymous })
      .where(eq(donations.id, donationId));

    return {
      success: true,
      isAnonymous: !!isAnonymous,
      message: isAnonymous
        ? 'আপনার পরিচয় সফলভাবে গোপন করা হয়েছে।'
        : 'আপনার পরিচয় সফলভাবে উন্মুক্ত করা হয়েছে।',
    };
  }

  async toggleItemDonationPrivacy(donorUser: any, itemDonationId: string, isAnonymous: boolean) {
    const target = await this.db
      .select()
      .from(itemDonations)
      .where(and(eq(itemDonations.id, itemDonationId), eq(itemDonations.donorId, donorUser.id)))
      .limit(1);

    if (target.length === 0) {
      throw new NotFoundException('Item donation record not found or not owned by you');
    }

    await this.db
      .update(itemDonations)
      .set({ isAnonymous: !!isAnonymous })
      .where(eq(itemDonations.id, itemDonationId));

    return {
      success: true,
      isAnonymous: !!isAnonymous,
      message: isAnonymous
        ? 'পণ্য অনুদানে পরিচয় সফলভাবে গোপন করা হয়েছে।'
        : 'পণ্য অনুদানে পরিচয় সফলভাবে উন্মুক্ত করা হয়েছে।',
    };
  }

  async listPendingDonations() {
    const list = await this.db
      .select({
        id: donations.id,
        donorId: donations.donorId,
        donorName: users.fullName,
        donorEmail: users.email,
        donorPhone: users.phone,
        postId: donations.postId,
        postTitle: studentPosts.title,
        amount: donations.amount,
        isRandom: donations.isRandom,
        paymentMethod: donations.paymentMethod,
        trxId: donations.transactionReference,
        donorNote: donations.donorNote,
        status: donations.status,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .where(eq(donations.status, DonationStatus.PENDING))
      .orderBy(desc(donations.createdAt));

    return list.map((d) => ({
      ...d,
      amount: Number(d.amount),
      donorName: d.donorName || 'অজ্ঞাত দাতা (Anonymous)',
      type: d.isRandom ? 'random' : 'direct',
      studentName: d.postTitle || 'সাধারণ শিক্ষা তহবিল',
      method: d.paymentMethod,
      time: d.createdAt ? new Date(d.createdAt).toLocaleString('bn-BD') : '',
    }));
  }

  async listDonationsHistory() {
    const list = await this.db
      .select({
        id: donations.id,
        donorId: donations.donorId,
        donorName: users.fullName,
        donorEmail: users.email,
        donorPhone: users.phone,
        postId: donations.postId,
        postTitle: studentPosts.title,
        amount: donations.amount,
        isRandom: donations.isRandom,
        paymentMethod: donations.paymentMethod,
        trxId: donations.transactionReference,
        donorNote: donations.donorNote,
        status: donations.status,
        rejectionReason: donations.rejectionReason,
        reviewedBy: donations.reviewedBy,
        reviewedAt: donations.reviewedAt,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .where(inArray(donations.status, [DonationStatus.ACCEPTED, DonationStatus.REJECTED]))
      .orderBy(desc(donations.reviewedAt), desc(donations.createdAt));

    return list.map((d) => ({
      ...d,
      amount: Number(d.amount),
      donorName: d.donorName || 'অজ্ঞাত দাতা (Anonymous)',
      type: d.isRandom ? 'random' : 'direct',
      studentName: d.postTitle || (d.isRandom ? 'সাধারণ শিক্ষা তহবিল' : 'সরাসরি শিক্ষার্থী'),
      method: d.paymentMethod,
      time: d.createdAt ? new Date(d.createdAt).toLocaleString('bn-BD') : '',
    }));
  }



  async listAllocationsHistory(user?: any) {
    if (user && user.role !== UserRole.MASTER_ADMIN) {
      const hasPerm = user.permissions?.some(
        (p: any) =>
          (p.moduleKey === PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION ||
            p.moduleKey === 'accounts_management.fund_allocation' ||
            p.moduleKey === 'accounts_management.donation_approval') &&
          (p.canView || p.canApprove || p.canEdit)
      );
      if (!hasPerm) {
        throw new ForbiddenException('ফান্ড বণ্টনের তথ্য দেখার জন্য আপনার পারমিশন নেই');
      }
    }

    const list = await this.db
      .select({
        id: fundAllocations.id,
        amount: fundAllocations.amount,
        notes: fundAllocations.notes,
        createdAt: fundAllocations.createdAt,
        studentPostId: fundAllocations.studentPostId,
        postTitle: studentPosts.title,
        studentName: studentPosts.studentFullName,
        studentId: studentPosts.studentId,
        orgName: organizations.name,
        allocatedByAdminName: users.fullName,
      })
      .from(fundAllocations)
      .innerJoin(studentPosts, eq(fundAllocations.studentPostId, studentPosts.id))
      .leftJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .leftJoin(users, eq(fundAllocations.allocatedBy, users.id))
      .orderBy(desc(fundAllocations.createdAt));

    return list.map((a) => ({
      ...a,
      amount: Number(a.amount),
    }));
  }

  async listEligibleStudentPostsForAllocation(user?: any) {
    if (user && user.role !== UserRole.MASTER_ADMIN) {
      const hasPerm = user.permissions?.some(
        (p: any) =>
          (p.moduleKey === PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION ||
            p.moduleKey === 'accounts_management.fund_allocation' ||
            p.moduleKey === 'accounts_management.donation_approval') &&
          (p.canView || p.canApprove || p.canEdit)
      );
      if (!hasPerm) {
        throw new ForbiddenException('ফান্ড বণ্টনের তথ্য দেখার জন্য আপনার পারমিশন নেই');
      }
    }

    const posts = await this.db
      .select({
        id: studentPosts.id,
        title: studentPosts.title,
        studentFullName: studentPosts.studentFullName,
        studentClassDepartment: studentPosts.studentClassDepartment,
        studentId: studentPosts.studentId,
        orgName: organizations.name,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        verificationStatus: studentPosts.verificationStatus,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .leftJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .where(
        and(
          eq(studentPosts.verificationStatus, 'approved'),
          sql`CAST(${studentPosts.remainingAmount} AS DECIMAL(12,2)) > 0`,
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    return posts.map((p) => ({
      ...p,
      totalRequiredAmount: Number(p.totalRequiredAmount),
      receivedAmount: Number(p.receivedAmount),
      remainingAmount: Number(p.remainingAmount),
    }));
  }

  // --------------------------------------------------------------------------
  // ITEM / NON-MONETARY DONATIONS
  // --------------------------------------------------------------------------
  async submitItemDonation(donorUser: any, input: CreateItemDonationInput) {
    if (!input.isRandom && !input.postId) {
      throw new BadRequestException('Direct student item donation requires post ID');
    }

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

    const itemDonationId = crypto.randomUUID();

    await this.db.insert(itemDonations).values({
      id: itemDonationId,
      donorId: donorUser ? donorUser.id : null,
      donorName: donorUser ? donorUser.fullName : 'অজ্ঞাত দাতা',
      donorPhone: input.donorPhone,
      itemName: input.itemName,
      description: input.description,
      quantity: input.quantity,
      isRandom: input.isRandom,
      isAnonymous: input.isAnonymous ?? false,
      postId: input.isRandom ? null : input.postId,
      pickupAddress: input.pickupAddress,
      status: DonationStatus.PENDING,
      deliveryStatus: 'pending_review',
    });

    // Notify Super Admins and Master Admin (Filtered by Permission)
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission: PermissionModuleKey.ITEM_DONATION_APPROVAL,
      titleBn: 'নতুন পণ্য অনুদান যাচাই ও অনুমোদন',
      titleEn: 'New In-Kind Item Donation Pending Approval',
      messageBn: `"${input.itemName}" (${input.quantity}) পণ্য অনুদানের একটি নতুন আবেদন এসেছে।`,
      messageEn: `An in-kind item donation ("${input.itemName}") has been submitted for verification.`,
      type: 'item_donation_created',
      link: '/admin?tab=item_donation_review',
    });

    return {
      success: true,
      message: 'Item donation request submitted successfully. Pending admin review.',
      itemDonationId,
    };
  }

  async reviewItemDonation(reviewer: any, input: ReviewItemDonationInput) {
    if (
      reviewer.role !== UserRole.MASTER_ADMIN &&
      reviewer.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Master Admin or Super Admin can review item donations');
    }

    const target = await this.db
      .select()
      .from(itemDonations)
      .where(eq(itemDonations.id, input.itemDonationId))
      .limit(1);

    if (target.length === 0) {
      throw new NotFoundException('Item donation request not found');
    }

    const item = target[0];

    await this.db
      .update(itemDonations)
      .set({
        status: input.status,
        adminInstruction: input.adminInstruction,
        deliveryStatus: input.status === DonationStatus.ACCEPTED ? 'instruction_given' : 'rejected',
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
      })
      .where(eq(itemDonations.id, input.itemDonationId));

    // Notify donor
    if (item.donorId) {
      if (input.status === DonationStatus.ACCEPTED) {
        await this.notificationsService.createNotification({
          recipientUserId: item.donorId,
          titleBn: 'পণ্য অনুদান অনুমোদিত হয়েছে',
          titleEn: 'Item Donation Request Accepted',
          messageBn: `আপনার "${item.itemName}" অনুদান আবেদনটি অনুমোদিত হয়েছে। অনুগ্রহ করে দিকনির্দেশনা অনুযায়ী পণ্য পাঠিয়ে আপনার প্রোফাইল থেকে "পণ্য পাঠানো হয়েছে" নিশ্চিত করুন।`,
          messageEn: `Your item donation for "${item.itemName}" was accepted. Please check logistics instruction.`,
          type: 'item_accepted',
          link: '/donor',
        });
      } else {
        await this.notificationsService.createNotification({
          recipientUserId: item.donorId,
          titleBn: 'পণ্য অনুদান বাতিল করা হয়েছে',
          titleEn: 'Item Donation Request Rejected',
          messageBn: `আপনার "${item.itemName}" অনুদান আবেদনটি গ্রহণ করা সম্ভব হয়নি। কারণ: ${input.adminInstruction}`,
          messageEn: `Your item donation was rejected: ${input.adminInstruction}`,
          type: 'item_rejected',
          link: '/donor',
        });
      }
    }

    return {
      success: true,
      message: `Item donation request ${input.status === DonationStatus.ACCEPTED ? 'accepted' : 'rejected'}.`,
    };
  }

  async shipItemDonation(donorUser: any, input: DonorShipItemDonationInput) {
    const target = await this.db
      .select()
      .from(itemDonations)
      .where(
        and(
          eq(itemDonations.id, input.itemDonationId),
          eq(itemDonations.donorId, donorUser.id)
        )
      )
      .limit(1);

    if (target.length === 0) {
      throw new NotFoundException('Item donation request not found or not owned by you');
    }

    if (target[0].status !== DonationStatus.ACCEPTED) {
      throw new BadRequestException('You can only reply to accepted item donation requests');
    }

    await this.db
      .update(itemDonations)
      .set({
        donorShipmentNote: input.shipmentNote,
        donorShippedAt: new Date(),
        deliveryStatus: 'shipped_by_donor',
      })
      .where(eq(itemDonations.id, input.itemDonationId));

    // Notify admins
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      titleBn: 'দাতা পণ্য পাঠিয়েছেন (চালান আপডেট)',
      titleEn: 'Donor Shipped Item',
      messageBn: `দাতা "${donorUser.fullName}" দানকৃত পণ্য "${target[0].itemName}" পাঠানোর চালান/নোট দিয়েছেন: ${input.shipmentNote}`,
      messageEn: `Donor "${donorUser.fullName}" dispatched "${target[0].itemName}": ${input.shipmentNote}`,
      type: 'item_shipped',
      link: '/admin?tab=item_donations',
    });

    return {
      success: true,
      message: 'পণ্য পাঠানোর তথ্য সফলভাবে সংরক্ষণ করা হয়েছে। এডমিন তা যাচাই করবে।',
    };
  }

  async adminFollowUpItemDonation(reviewer: any, input: AdminFollowUpItemDonationInput) {
    if (
      reviewer.role !== UserRole.MASTER_ADMIN &&
      reviewer.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Master Admin or Super Admin can manage item donations');
    }

    const target = await this.db
      .select()
      .from(itemDonations)
      .where(eq(itemDonations.id, input.itemDonationId))
      .limit(1);

    if (target.length === 0) {
      throw new NotFoundException('Item donation request not found');
    }

    const item = target[0];
    const updateData: any = {};

    if (input.adminReply !== undefined) {
      updateData.adminFollowUpReply = input.adminReply;
    }

    if (input.assignedStudentId) {
      // Validate student exists
      const studentUser = await this.db
        .select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(eq(users.id, input.assignedStudentId))
        .limit(1);

      if (studentUser.length === 0) {
        throw new NotFoundException('Assigned student user not found');
      }

      updateData.assignedStudentId = input.assignedStudentId;
      updateData.deliveryStatus = 'delivered_to_student';
    } else if (input.deliveryStatus) {
      updateData.deliveryStatus = input.deliveryStatus;
    }

    await this.db
      .update(itemDonations)
      .set(updateData)
      .where(eq(itemDonations.id, input.itemDonationId));

    // If student assigned, notify student
    if (input.assignedStudentId) {
      await this.notificationsService.createNotification({
        recipientUserId: input.assignedStudentId,
        titleBn: 'আপনার জন্য শিক্ষা সামগ্রী বরাদ্দ করা হয়েছে',
        titleEn: 'Educational Item Allocated',
        messageBn: `কর্তৃপক্ষ আপনার জন্য "${item.itemName} (${item.quantity})" উপহার/শিক্ষা সামগ্রী হিসেবে বরাদ্দ করেছেন।`,
        messageEn: `Admin allocated item "${item.itemName}" to your profile.`,
        type: 'item_assigned',
        link: '/student',
      });
    }

    // Notify donor
    if (item.donorId) {
      await this.notificationsService.createNotification({
        recipientUserId: item.donorId,
        titleBn: 'পণ্য অনুদানের সর্বশেষ আপডেট',
        titleEn: 'Item Donation Status Updated',
        messageBn: input.assignedStudentId
          ? `আপনার দানকৃত "${item.itemName}" শিক্ষার্থীকে সফলভাবে বরাদ্দ করা হয়েছে। উক্ত শিক্ষার্থীর প্রোফাইলে তা দেখতে পারেন।`
          : `কর্তৃপক্ষ আপনার দানকৃত "${item.itemName}" এর রিপ্লাই দিয়েছেন: ${input.adminReply || 'হালনাগাদ সম্পন্ন'}`,
        messageEn: `Admin updated your item donation: ${input.adminReply || 'Delivered/Assigned'}`,
        type: 'item_updated',
        link: '/donor',
      });
    }

    return {
      success: true,
      message: 'পণ্য অনুদান সফলভাবে আপডেট ও শিক্ষার্থী এসাইন করা হয়েছে।',
    };
  }

  async getMyItemDonations(donorUser: any) {
    const list = await this.db
      .select({
        id: itemDonations.id,
        itemName: itemDonations.itemName,
        description: itemDonations.description,
        quantity: itemDonations.quantity,
        isRandom: itemDonations.isRandom,
        isAnonymous: itemDonations.isAnonymous,
        status: itemDonations.status,
        adminInstruction: itemDonations.adminInstruction,
        donorShipmentNote: itemDonations.donorShipmentNote,
        donorShippedAt: itemDonations.donorShippedAt,
        adminFollowUpReply: itemDonations.adminFollowUpReply,
        assignedStudentId: itemDonations.assignedStudentId,
        assignedStudentName: users.fullName,
        deliveryStatus: itemDonations.deliveryStatus,
        pickupAddress: itemDonations.pickupAddress,
        createdAt: itemDonations.createdAt,
        postId: itemDonations.postId,
        postTitle: studentPosts.title,
        studentUserId: studentPosts.studentId,
      })
      .from(itemDonations)
      .leftJoin(studentPosts, eq(itemDonations.postId, studentPosts.id))
      .leftJoin(users, eq(itemDonations.assignedStudentId, users.id))
      .where(eq(itemDonations.donorId, donorUser.id))
      .orderBy(desc(itemDonations.createdAt));

    return list;
  }

  async listItemDonationRequests() {
    const list = await this.db
      .select({
        id: itemDonations.id,
        donorId: itemDonations.donorId,
        donorName: itemDonations.donorName,
        donorPhone: itemDonations.donorPhone,
        itemName: itemDonations.itemName,
        description: itemDonations.description,
        quantity: itemDonations.quantity,
        isRandom: itemDonations.isRandom,
        isAnonymous: itemDonations.isAnonymous,
        postId: itemDonations.postId,
        postTitle: studentPosts.title,
        pickupAddress: itemDonations.pickupAddress,
        status: itemDonations.status,
        adminInstruction: itemDonations.adminInstruction,
        donorShipmentNote: itemDonations.donorShipmentNote,
        donorShippedAt: itemDonations.donorShippedAt,
        adminFollowUpReply: itemDonations.adminFollowUpReply,
        assignedStudentId: itemDonations.assignedStudentId,
        assignedStudentName: users.fullName,
        deliveryStatus: itemDonations.deliveryStatus,
        createdAt: itemDonations.createdAt,
      })
      .from(itemDonations)
      .leftJoin(studentPosts, eq(itemDonations.postId, studentPosts.id))
      .leftJoin(users, eq(itemDonations.assignedStudentId, users.id))
      .orderBy(desc(itemDonations.createdAt));

    return list;
  }

  async getPublicTransparencyFeed() {
    // 1. Accepted Donations
    const acceptedDonations = await this.db
      .select({
        id: donations.id,
        amount: donations.amount,
        isRandom: donations.isRandom,
        isAnonymous: donations.isAnonymous,
        paymentMethod: donations.paymentMethod,
        createdAt: donations.createdAt,
        donorName: users.fullName,
        donorRole: users.role,
        donorAvatarUrl: users.avatarUrl,
        postTitle: studentPosts.title,
        studentName: studentPosts.studentFullName,
        orgName: organizations.name,
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .leftJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .where(eq(donations.status, DonationStatus.ACCEPTED))
      .orderBy(desc(donations.createdAt))
      .limit(100);

    // 2. Fund Allocations from General Education Fund (On behalf of Sadaqah BD)
    const allocations = await this.db
      .select({
        id: fundAllocations.id,
        amount: fundAllocations.amount,
        createdAt: fundAllocations.createdAt,
        notes: fundAllocations.notes,
        postTitle: studentPosts.title,
        studentName: studentPosts.studentFullName,
        orgName: organizations.name,
        allocatedByAdminName: users.fullName,
        allocatedByAdminRole: users.role,
      })
      .from(fundAllocations)
      .innerJoin(studentPosts, eq(fundAllocations.studentPostId, studentPosts.id))
      .leftJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .leftJoin(users, eq(fundAllocations.allocatedBy, users.id))
      .orderBy(desc(fundAllocations.createdAt))
      .limit(50);

    const formattedDonations = acceptedDonations.map((d) => {
      const isAnon = d.isAnonymous;
      return {
        id: d.id,
        type: 'monetary',
        isAnonymous: isAnon,
        donorName: isAnon ? 'গোপন রাখা হয়েছে' : (d.donorName || 'সম্মানিত শুভাকাঙ্ক্ষী'),
        donorRole: isAnon ? null : (d.donorRole || 'donor'),
        donorAvatarUrl: isAnon ? null : d.donorAvatarUrl,
        targetType: d.isRandom ? 'general_fund' : 'student_post',
        targetLabel: d.isRandom
          ? 'সাদাকাহ বিডি ফান্ড'
          : `${d.studentName || 'শিক্ষার্থী'}${d.orgName ? ` • ${d.orgName}` : ''}`,
        amount: Number(d.amount),
        paymentMethod: d.paymentMethod,
        createdAt: d.createdAt,
      };
    });

    const formattedAllocations = allocations.map((a) => ({
      id: a.id,
      type: 'fund_allocation',
      isAnonymous: false,
      donorName: 'সাদাকাহ বিডি',
      donorRole: 'organization',
      donorAvatarUrl: null,
      targetType: 'student_post',
      targetLabel: `${a.studentName || 'শিক্ষার্থী'}${a.orgName ? ` • ${a.orgName}` : ''}`,
      amount: Number(a.amount),
      paymentMethod: 'শিক্ষা তহবিল বরাদ্দ',
      createdAt: a.createdAt,
    }));

    const allFeeds = [...formattedDonations, ...formattedAllocations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allFeeds.slice(0, 100);
  }

  async getAdminDonorsAndDonations(adminUser: any) {
    if (
      adminUser.role !== UserRole.MASTER_ADMIN &&
      adminUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }

    const reviewerUser = alias(users, 'reviewer_user');

    // Fetch all distinct donor users who have actually made at least one donation
    const donorRows = await this.db
      .selectDistinct({ donorId: donations.donorId })
      .from(donations)
      .where(sql`${donations.donorId} IS NOT NULL`);

    const donorUserIds = donorRows.map((r) => r.donorId).filter(Boolean) as string[];
    if (donorUserIds.length === 0) {
      return [];
    }

    // Fetch current user info for each donor (reflects live name, avatar, role, phone)
    const donorUsers = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        avatarUrl: users.avatarUrl,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(inArray(users.id, donorUserIds), isNull(users.deletedAt)));

    // Fetch all donations by these users with post, school and reviewer audit details
    const allDonations = await this.db
      .select({
        id: donations.id,
        donorId: donations.donorId,
        amount: donations.amount,
        isRandom: donations.isRandom,
        isAnonymous: donations.isAnonymous,
        paymentMethod: donations.paymentMethod,
        trxId: donations.transactionReference,
        donorNote: donations.donorNote,
        status: donations.status,
        rejectionReason: donations.rejectionReason,
        createdAt: donations.createdAt,
        reviewedAt: donations.reviewedAt,
        postTitle: studentPosts.title,
        studentName: studentPosts.studentFullName,
        orgName: organizations.name,
        reviewerName: reviewerUser.fullName,
        reviewerRole: reviewerUser.role,
        reviewerPhone: reviewerUser.phone,
      })
      .from(donations)
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .leftJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .leftJoin(reviewerUser, eq(donations.reviewedBy, reviewerUser.id))
      .where(inArray(donations.donorId, donorUserIds))
      .orderBy(desc(donations.createdAt));

    // Aggregate per donor
    const donorsMap = new Map<string, any>();
    for (const u of donorUsers) {
      donorsMap.set(u.id, {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatarUrl,
        status: u.status,
        joinedAt: u.createdAt,
        totalDonatedAmount: 0,
        totalDonationsCount: 0,
        acceptedDonationsCount: 0,
        pendingDonationsCount: 0,
        lastDonatedAt: null as Date | null,
        transactions: [] as any[],
      });
    }

    for (const d of allDonations) {
      if (!d.donorId || !donorsMap.has(d.donorId)) continue;
      const donorObj = donorsMap.get(d.donorId);
      const amt = Number(d.amount);

      donorObj.totalDonationsCount += 1;
      if (d.status === DonationStatus.ACCEPTED) {
        donorObj.totalDonatedAmount += amt;
        donorObj.acceptedDonationsCount += 1;
      } else if (d.status === DonationStatus.PENDING) {
        donorObj.pendingDonationsCount += 1;
      }

      if (!donorObj.lastDonatedAt || new Date(d.createdAt) > new Date(donorObj.lastDonatedAt)) {
        donorObj.lastDonatedAt = d.createdAt;
      }

      donorObj.transactions.push({
        id: d.id,
        amount: amt,
        isRandom: d.isRandom,
        isAnonymous: d.isAnonymous,
        paymentMethod: d.paymentMethod,
        trxId: d.trxId,
        donorNote: d.donorNote,
        status: d.status,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
        targetName: d.isRandom
          ? 'সাদাকাহ বিডি সাধারণ শিক্ষা তহবিল'
          : `${d.studentName || 'শিক্ষার্থী'}${d.orgName ? ` (${d.orgName})` : ''}`,
        postTitle: d.postTitle,
        reviewer: d.reviewerName
          ? {
              name: d.reviewerName,
              role: d.reviewerRole,
              phone: d.reviewerPhone,
            }
          : null,
      });
    }

    // Convert map to array and sort by totalDonatedAmount DESC (Highest donors on top)
    const result = Array.from(donorsMap.values()).sort((a, b) => {
      if (b.totalDonatedAmount !== a.totalDonatedAmount) {
        return b.totalDonatedAmount - a.totalDonatedAmount;
      }
      return b.totalDonationsCount - a.totalDonationsCount;
    });

    return result;
  }
}

