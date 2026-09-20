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
  studentPosts,
  studentPostExpenses,
  studentProfiles,
  users,
  organizations,
} from '../../database';
import { eq, and, or, isNull, desc } from 'drizzle-orm';
import {
  CreateStudentPostInput,
  PostVerificationStatus,
  UserRole,
} from '@sadaqahbd/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService
  ) {}

  async createPost(studentUser: any, input: CreateStudentPostInput) {
    if (studentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only verified students can create donation posts');
    }

    // Check if student profile is verified by their organization
    const profile = await this.db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentUser.id))
      .limit(1);

    if (profile.length === 0 || profile[0].verificationStatus !== 'verified') {
      throw new BadRequestException(
        'You must complete your profile and be verified by your organization before posting'
      );
    }

    const orgId = studentUser.organizationId || profile[0]?.organizationId;
    if (!orgId) {
      throw new BadRequestException('Student must be enrolled in an organization');
    }

    // Fetch organization info for notification
    const [org] = await this.db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const orgName = org?.name || 'শিক্ষা প্রতিষ্ঠান';

    // Calculate total required from expenses
    const totalAmount = input.expenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    const postId = crypto.randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(studentPosts).values({
        id: postId,
        studentId: studentUser.id,
        organizationId: orgId,
        title: input.title,
        problemDescription: input.problemDescription,
        totalRequiredAmount: totalAmount.toFixed(2),
        receivedAmount: '0.00',
        remainingAmount: totalAmount.toFixed(2),
        verificationStatus: PostVerificationStatus.PENDING_ORG,
        isTeacherVerified: false,
        isOrgVerified: false,
        isDoubleVerified: false,
      });

      for (const expense of input.expenses) {
        await tx.insert(studentPostExpenses).values({
          postId,
          categoryName: expense.categoryName,
          amount: Number(expense.amount).toFixed(2),
        });
      }
    });

    // 1. Notify the Student's Organization
    await this.notificationsService.createNotification({
      recipientOrgId: orgId,
      titleBn: 'নতুন শিক্ষার্থী সহায়তা আবেদন',
      titleEn: 'New Student Aid Application',
      messageBn: `শিক্ষার্থী "${studentUser.fullName}" একটি নতুন শিক্ষা সহায়তা আবেদন ("${input.title}") জমা দিয়েছেন। বিস্তারিত পর্যালোচনা করে ছাড়পত্র দিন।`,
      messageEn: `Student "${studentUser.fullName}" submitted a new aid campaign for verification.`,
      type: 'student_post_created',
      link: '/organization?tab=post_approvals',
    });

    // 2. Notify Teachers of the institution
    await this.notificationsService.createNotification({
      recipientRole: 'teacher',
      titleBn: 'শিক্ষার্থীর নতুন সহায়তা আবেদন',
      titleEn: 'Student Aid Campaign Submitted',
      messageBn: `আপনার প্রতিষ্ঠানের শিক্ষার্থী "${studentUser.fullName}" সহায়তার আবেদন ("${input.title}") করেছেন। শিক্ষক হিসেবে সত্যায়ন করুন।`,
      messageEn: `Student "${studentUser.fullName}" submitted an aid campaign. Please verify as teacher.`,
      type: 'student_post_created',
      link: '/teacher?tab=post_approvals',
    });

    // 3. Notify Super Admin & Master Admin
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      titleBn: 'নতুন শিক্ষার্থী পোস্ট জমা হয়েছে',
      titleEn: 'New Student Post Submitted',
      messageBn: `শিক্ষার্থী "${studentUser.fullName}" ("${orgName}") নতুন সহায়তা পোস্ট তৈরি করেছেন। ছাড়পত্র পর্যালোচনা করুন।`,
      messageEn: `Student "${studentUser.fullName}" created a new campaign.`,
      type: 'student_post_created',
      link: '/admin?tab=student_post_requests',
    });

    // 4. Notify the Student
    await this.notificationsService.createNotification({
      recipientUserId: studentUser.id,
      titleBn: 'আপনার আবেদন সফলভাবে জমা হয়েছে',
      titleEn: 'Application Submitted Successfully',
      messageBn: `আপনার পোস্ট "${input.title}" প্রতিষ্ঠান ও এডমিন অনুমোদনের জন্য অপেক্ষমান রয়েছে।`,
      messageEn: `Your post "${input.title}" is pending institutional and administrative review.`,
      type: 'student_post_created',
      link: '/student?tab=applications',
    });

    return {
      success: true,
      message: 'Donation post submitted for organization verification',
      postId,
    };
  }

  async getPostDetails(postId: string) {
    const post = await this.db
      .select({
        id: studentPosts.id,
        studentId: studentPosts.studentId,
        organizationId: studentPosts.organizationId,
        title: studentPosts.title,
        problemDescription: studentPosts.problemDescription,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        verificationStatus: studentPosts.verificationStatus,
        isTeacherVerified: studentPosts.isTeacherVerified,
        isOrgVerified: studentPosts.isOrgVerified,
        isDoubleVerified: studentPosts.isDoubleVerified,
        rejectionReason: studentPosts.rejectionReason,
        createdAt: studentPosts.createdAt,
        studentName: users.fullName,
        orgName: organizations.name,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .innerJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .where(and(eq(studentPosts.id, postId), isNull(studentPosts.deletedAt)))
      .limit(1);

    if (post.length === 0) {
      throw new NotFoundException('Post not found');
    }

    const expenses = await this.db
      .select()
      .from(studentPostExpenses)
      .where(eq(studentPostExpenses.postId, postId));

    return {
      ...post[0],
      expenses,
    };
  }

  async listPublicVerifiedPosts() {
    const posts = await this.db
      .select({
        id: studentPosts.id,
        title: studentPosts.title,
        problemDescription: studentPosts.problemDescription,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        isDoubleVerified: studentPosts.isDoubleVerified,
        createdAt: studentPosts.createdAt,
        studentName: users.fullName,
        orgName: organizations.name,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .innerJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .where(
        and(
          eq(studentPosts.verificationStatus, PostVerificationStatus.APPROVED),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    const result: any[] = [];
    for (const p of posts) {
      const expenses = await this.db
        .select({
          categoryName: studentPostExpenses.categoryName,
          amount: studentPostExpenses.amount,
        })
        .from(studentPostExpenses)
        .where(eq(studentPostExpenses.postId, p.id));

      result.push({
        ...p,
        totalRequiredAmount: Number(p.totalRequiredAmount),
        receivedAmount: Number(p.receivedAmount),
        remainingAmount: Number(p.remainingAmount),
        expenses: expenses.map((e) => ({
          categoryName: e.categoryName,
          amount: Number(e.amount),
        })),
      });
    }

    return result;
  }

  async listStudentMyPosts(studentUser: any) {
    const posts = await this.db
      .select({
        id: studentPosts.id,
        title: studentPosts.title,
        problemDescription: studentPosts.problemDescription,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        verificationStatus: studentPosts.verificationStatus,
        isTeacherVerified: studentPosts.isTeacherVerified,
        isOrgVerified: studentPosts.isOrgVerified,
        isDoubleVerified: studentPosts.isDoubleVerified,
        rejectionReason: studentPosts.rejectionReason,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .where(
        and(
          eq(studentPosts.studentId, studentUser.id),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    const result: any[] = [];
    for (const p of posts) {
      const expenses = await this.db
        .select({
          categoryName: studentPostExpenses.categoryName,
          amount: studentPostExpenses.amount,
        })
        .from(studentPostExpenses)
        .where(eq(studentPostExpenses.postId, p.id));

      result.push({
        ...p,
        totalRequiredAmount: Number(p.totalRequiredAmount),
        receivedAmount: Number(p.receivedAmount),
        remainingAmount: Number(p.remainingAmount),
        expenses: expenses.map((e) => ({
          categoryName: e.categoryName,
          amount: Number(e.amount),
        })),
      });
    }

    return result;
  }

  async listTeacherPendingPosts(teacherUser: any) {
    if (!teacherUser.organizationId) return [];

    const posts = await this.db
      .select({
        id: studentPosts.id,
        studentId: studentPosts.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        title: studentPosts.title,
        problemDesc: studentPosts.problemDescription,
        amount: studentPosts.totalRequiredAmount,
        teacherVerified: studentPosts.isTeacherVerified,
        orgVerified: studentPosts.isOrgVerified,
        status: studentPosts.verificationStatus,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .where(
        and(
          eq(studentPosts.organizationId, teacherUser.organizationId),
          eq(studentPosts.isTeacherVerified, false),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    const result: any[] = [];
    for (const p of posts) {
      const expenses = await this.db
        .select({
          category: studentPostExpenses.categoryName,
          amount: studentPostExpenses.amount,
        })
        .from(studentPostExpenses)
        .where(eq(studentPostExpenses.postId, p.id));

      result.push({
        ...p,
        amount: Number(p.amount),
        expenses: expenses.map((e) => ({
          category: e.category,
          amount: Number(e.amount),
        })),
      });
    }

    return result;
  }

  async listOrgPendingPosts(orgUser: any) {
    let orgId = orgUser.organizationId;
    if (!orgId) {
      const [found] = await this.db
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          or(
            eq(organizations.requestedByUserId, orgUser.id),
            eq(organizations.id, orgUser.id)
          )
        )
        .limit(1);
      if (found) orgId = found.id;
    }
    if (!orgId) return [];

    const posts = await this.db
      .select({
        id: studentPosts.id,
        studentId: studentPosts.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        title: studentPosts.title,
        problemDesc: studentPosts.problemDescription,
        amount: studentPosts.totalRequiredAmount,
        teacherVerified: studentPosts.isTeacherVerified,
        orgVerified: studentPosts.isOrgVerified,
        status: studentPosts.verificationStatus,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .where(
        and(
          eq(studentPosts.organizationId, orgId),
          eq(studentPosts.isOrgVerified, false),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    const result: any[] = [];
    for (const p of posts) {
      const expenses = await this.db
        .select({
          category: studentPostExpenses.categoryName,
          amount: studentPostExpenses.amount,
        })
        .from(studentPostExpenses)
        .where(eq(studentPostExpenses.postId, p.id));

      result.push({
        ...p,
        amount: Number(p.amount),
        expenses: expenses.map((e) => ({
          category: e.category,
          amount: Number(e.amount),
        })),
      });
    }

    return result;
  }

  async teacherVerifyPost(postId: string, teacherUser: any, approved: boolean) {
    const post = await this.db
      .select()
      .from(studentPosts)
      .where(eq(studentPosts.id, postId))
      .limit(1);

    if (post.length === 0) throw new NotFoundException('Post not found');
    const targetPost = post[0];

    // Must be in same organization
    if (teacherUser.organizationId !== targetPost.organizationId) {
      throw new ForbiddenException('Teacher can only verify posts from their organization');
    }

    const isDouble = approved && targetPost.isOrgVerified;

    await this.db
      .update(studentPosts)
      .set({
        isTeacherVerified: approved,
        teacherVerifiedBy: teacherUser.id,
        isDoubleVerified: isDouble,
      })
      .where(eq(studentPosts.id, postId));

    // Notify the student
    await this.notificationsService.createNotification({
      recipientUserId: targetPost.studentId,
      titleBn: approved ? 'শিক্ষক আপনার পোস্ট সত্যায়ন করেছেন' : 'শিক্ষক পোস্ট অনুমোদন করেননি',
      titleEn: approved ? 'Teacher Endorsed Your Post' : 'Teacher Rejected Your Post',
      messageBn: approved
        ? `শিক্ষক "${teacherUser.fullName}" আপনার পোস্ট "${targetPost.title}" সত্যায়ন করেছেন।`
        : `শিক্ষক "${teacherUser.fullName}" আপনার পোস্টটি প্রত্যাখ্যান করেছেন।`,
      messageEn: approved
        ? `Teacher "${teacherUser.fullName}" endorsed your post "${targetPost.title}".`
        : `Teacher "${teacherUser.fullName}" rejected your post.`,
      type: 'post_teacher_verified',
      link: '/student?tab=applications',
    });

    return { success: true, message: 'Teacher verification recorded' };
  }

  async orgVerifyPost(postId: string, orgUser: any, approved: boolean) {
    const post = await this.db
      .select()
      .from(studentPosts)
      .where(eq(studentPosts.id, postId))
      .limit(1);

    if (post.length === 0) throw new NotFoundException('Post not found');
    const targetPost = post[0];

    // Verify organization ownership
    let orgId = orgUser.organizationId;
    if (!orgId) {
      const [found] = await this.db
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          or(
            eq(organizations.requestedByUserId, orgUser.id),
            eq(organizations.id, orgUser.id)
          )
        )
        .limit(1);
      if (found) orgId = found.id;
    }

    if (orgId !== targetPost.organizationId && orgUser.role !== UserRole.MASTER_ADMIN) {
      throw new ForbiddenException('Organization can only verify its own posts');
    }

    const isDouble = approved && targetPost.isTeacherVerified;
    const nextStatus = approved
      ? PostVerificationStatus.PENDING_SUPER_ADMIN
      : PostVerificationStatus.REJECTED;

    await this.db
      .update(studentPosts)
      .set({
        isOrgVerified: approved,
        orgVerifiedBy: orgUser.id,
        isDoubleVerified: isDouble,
        verificationStatus: nextStatus,
      })
      .where(eq(studentPosts.id, postId));

    if (approved) {
      // 1. Notify Super Admin & Master Admin
      await this.notificationsService.createNotification({
        recipientRole: 'admin',
        titleBn: 'প্রতিষ্ঠান কর্তৃক শিক্ষার্থী পোস্ট অনুমোদিত',
        titleEn: 'Student Campaign Cleared by Institution',
        messageBn: `প্রতিষ্ঠান কর্তৃক "${targetPost.title}" পোস্টটি সিলমোহর করা হয়েছে। এখন সুপার এডমিন চূড়ান্ত ছাড়পত্র প্রদান করতে পারেন।`,
        messageEn: `Post "${targetPost.title}" was approved by institution. Ready for final admin approval.`,
        type: 'post_org_approved',
        link: '/admin?tab=student_post_requests',
      });

      // 2. Notify Student
      await this.notificationsService.createNotification({
        recipientUserId: targetPost.studentId,
        titleBn: 'আপনার পোস্টটি প্রতিষ্ঠান অনুমোদন করেছে!',
        titleEn: 'Post Approved by Institution!',
        messageBn: `আপনার আবেদন "${targetPost.title}" প্রতিষ্ঠান অনুমোদন করেছে। এখন সুপার এডমিনের চূড়ান্ত ছাড়পত্রের অপেক্ষায় রয়েছে।`,
        messageEn: `Your campaign "${targetPost.title}" has been cleared by your organization.`,
        type: 'post_org_approved',
        link: '/student?tab=applications',
      });
    } else {
      await this.notificationsService.createNotification({
        recipientUserId: targetPost.studentId,
        titleBn: 'পোস্ট প্রতিষ্ঠান দ্বারা প্রত্যাখ্যাত হয়েছে',
        titleEn: 'Post Rejected by Institution',
        messageBn: `আপনার আবেদন "${targetPost.title}" প্রতিষ্ঠান দ্বারা প্রত্যাখ্যাত হয়েছে।`,
        messageEn: `Your post was rejected by your organization.`,
        type: 'post_rejected',
        link: '/student?tab=applications',
      });
    }

    return {
      success: true,
      message: approved
        ? 'Post verified by organization and forwarded to Super Admin for approval'
        : 'Post rejected by organization',
    };
  }

  async superAdminApprovePost(
    postId: string,
    adminUser: any,
    approved: boolean,
    rejectionReason?: string
  ) {
    const post = await this.db
      .select({
        post: studentPosts,
        studentName: users.fullName,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .where(eq(studentPosts.id, postId))
      .limit(1);

    if (post.length === 0) throw new NotFoundException('Post not found');
    const targetPost = post[0].post;
    const studentName = post[0].studentName;

    // Direct platform admin clearance: if approved by admin, ensure isOrgVerified is stamped
    const autoVerifyOrg = approved && !targetPost.isOrgVerified;

    await this.db
      .update(studentPosts)
      .set({
        verificationStatus: approved
          ? PostVerificationStatus.APPROVED
          : PostVerificationStatus.REJECTED,
        superAdminApprovedBy: adminUser.id,
        isOrgVerified: autoVerifyOrg ? true : targetPost.isOrgVerified,
        rejectionReason: approved ? null : rejectionReason,
      })
      .where(eq(studentPosts.id, postId));

    // Send notifications!
    await this.notificationsService.createNotification({
      recipientUserId: targetPost.studentId,
      titleBn: approved
        ? 'অভিনন্দন! আপনার আবেদনটি লাইভ করা হয়েছে'
        : 'পোস্ট ছাড়পত্র প্রত্যাখ্যাত হয়েছে',
      titleEn: approved ? 'Campaign Approved & Live!' : 'Campaign Rejected by Admin',
      messageBn: approved
        ? `আপনার শিক্ষা সহায়তা আবেদন "${targetPost.title}" চূড়ান্ত অনুমোদন পেয়েছে এবং অনুদানের জন্য লাইভ করা হয়েছে!`
        : `আপনার আবেদনটি এডমিন দ্বারা প্রত্যাখ্যাত হয়েছে। কারণ: ${rejectionReason || 'যথাযথ তথ্যের অভাব'}`,
      messageEn: approved
        ? `Your student campaign "${targetPost.title}" has been approved and is now live for public donations!`
        : `Your application has been rejected by admin. Reason: ${rejectionReason || 'Incomplete details'}`,
      type: approved ? 'post_approved' : 'post_rejected',
      link: '/student?tab=applications',
    });

    if (targetPost.organizationId) {
      await this.notificationsService.createNotification({
        recipientOrgId: targetPost.organizationId,
        titleBn: approved
          ? 'শিক্ষার্থীর পোস্ট চূড়ান্ত অনুমোদিত'
          : 'শিক্ষার্থী পোস্ট ছাড়পত্র প্রত্যাখ্যাত',
        titleEn: approved ? 'Student Campaign Live' : 'Student Campaign Rejected',
        messageBn: approved
          ? `আপনার প্রতিষ্ঠানের শিক্ষার্থী "${studentName}"-এর পোস্ট "${targetPost.title}" এডমিন অনুমোদন দিয়েছেন।`
          : `পোস্ট "${targetPost.title}" এডমিন দ্বারা প্রত্যাখ্যাত হয়েছে।`,
        messageEn: approved
          ? `Campaign "${targetPost.title}" for student "${studentName}" has been approved by admin.`
          : `Campaign "${targetPost.title}" was rejected by admin.`,
        type: 'post_approved',
        link: '/organization?tab=post_approvals',
      });
    }

    return {
      success: true,
      message: approved
        ? 'Post approved and is now live for public donations'
        : 'Post rejected with reason provided',
    };
  }

  async listPendingSuperAdminPosts() {
    const posts = await this.db
      .select({
        id: studentPosts.id,
        studentId: studentPosts.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        organizationId: studentPosts.organizationId,
        institution: organizations.name,
        title: studentPosts.title,
        problemDesc: studentPosts.problemDescription,
        amount: studentPosts.totalRequiredAmount,
        teacherVerified: studentPosts.isTeacherVerified,
        orgVerified: studentPosts.isOrgVerified,
        status: studentPosts.verificationStatus,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .innerJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .where(
        and(
          or(
            eq(studentPosts.verificationStatus, PostVerificationStatus.PENDING_SUPER_ADMIN),
            eq(studentPosts.verificationStatus, PostVerificationStatus.PENDING_ORG)
          ),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    const result: any[] = [];
    for (const p of posts) {
      const expenses = await this.db
        .select({
          category: studentPostExpenses.categoryName,
          amount: studentPostExpenses.amount,
        })
        .from(studentPostExpenses)
        .where(eq(studentPostExpenses.postId, p.id));

      result.push({
        ...p,
        amount: Number(p.amount),
        expenses: expenses.map((e) => ({
          category: e.category,
          amount: Number(e.amount),
        })),
      });
    }

    return result;
  }
}

