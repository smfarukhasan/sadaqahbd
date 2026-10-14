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
  teacherProfiles,
  users,
  organizations,
  donations,
  fundAllocations,
  itemDonations,
} from '../../database';
import { eq, and, or, isNull, desc, ne, sql, inArray } from 'drizzle-orm';
import {
  CreateStudentPostInput,
  PostVerificationStatus,
  UserRole,
  PermissionModuleKey,
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
        studentFullName: input.fullName || studentUser.fullName,
        studentClassDepartment: input.classDepartment || [profile[0]?.className, profile[0]?.department, profile[0]?.rollNumber ? `রোল: ${profile[0]?.rollNumber}` : null].filter(Boolean).join(' • ') || profile[0]?.studentClassRoll,
        fatherName: input.fatherName || profile[0]?.fatherName || null,
        phone: input.phone || studentUser.phone,
        address: input.address || profile[0]?.presentAddress || profile[0]?.address || studentUser.address,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        durationText: input.durationText || null,
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
      recipientRole: 'organization',
      titleBn: 'নতুন শিক্ষার্থী সহায়তা আবেদন',
      titleEn: 'New Student Aid Application',
      messageBn: `শিক্ষার্থী "${studentUser.fullName}" একটি নতুন শিক্ষা সহায়তা আবেদন ("${input.title}") জমা দিয়েছেন। বিস্তারিত পর্যালোচনা করে ছাড়পত্র দিন।`,
      messageEn: `Student "${studentUser.fullName}" submitted a new aid campaign for verification.`,
      type: 'student_post_created',
      link: '/organization?tab=post_approvals',
    });

    // 2. Notify Teachers of the student's specific institution
    await this.notificationsService.createNotification({
      recipientRole: 'teacher',
      recipientOrgId: orgId,
      titleBn: 'শিক্ষার্থীর নতুন সহায়তা আবেদন',
      titleEn: 'Student Aid Campaign Submitted',
      messageBn: `আপনার প্রতিষ্ঠানের শিক্ষার্থী "${studentUser.fullName}" সহায়তার আবেদন ("${input.title}") করেছেন। শিক্ষক হিসেবে সত্যায়ন করুন।`,
      messageEn: `Student "${studentUser.fullName}" submitted an aid campaign. Please verify as teacher.`,
      type: 'student_post_created',
      link: '/teacher?tab=post_approvals',
    });

    // 3. Notify Super Admin & Master Admin (Filtered by Permission)
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS,
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

  async getPostDetails(postId: string, currentUserId?: string) {
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
        teacherVerifiedBy: studentPosts.teacherVerifiedBy,
        isOrgVerified: studentPosts.isOrgVerified,
        orgVerifiedBy: studentPosts.orgVerifiedBy,
        isDoubleVerified: studentPosts.isDoubleVerified,
        superAdminApprovedBy: studentPosts.superAdminApprovedBy,
        adminModificationReason: studentPosts.adminModificationReason,
        studentFullName: studentPosts.studentFullName,
        studentClassDepartment: studentPosts.studentClassDepartment,
        fatherName: studentPosts.fatherName,
        phone: studentPosts.phone,
        address: studentPosts.address,
        startDate: studentPosts.startDate,
        endDate: studentPosts.endDate,
        durationText: studentPosts.durationText,
        rejectionReason: studentPosts.rejectionReason,
        createdAt: studentPosts.createdAt,
        updatedAt: studentPosts.updatedAt,
        studentName: users.fullName,
        studentPhone: users.phone,
        studentEmail: users.email,
        studentPhotoUrl: sql<string | null>`COALESCE(${studentProfiles.photoUrl}, ${users.avatarUrl})`,
        studentRoll: studentProfiles.rollNumber,
        studentClassRoll: studentProfiles.studentClassRoll,
        studentClassName: studentProfiles.className,
        studentDepartment: studentProfiles.department,
        studentFatherName: studentProfiles.fatherName,
        studentBloodGroup: studentProfiles.bloodGroup,
        studentDateOfBirth: studentProfiles.dateOfBirth,
        studentAddress: studentProfiles.address,
        studentPresentAddress: studentProfiles.presentAddress,
        studentPermanentAddress: studentProfiles.permanentAddress,
        studentInstitutionName: studentProfiles.institutionName,
        studentVerificationStatus: studentProfiles.verificationStatus,
        studentOrgApprovedAt: studentProfiles.orgApprovedAt,
        studentAdminApprovedAt: studentProfiles.adminApprovedAt,
        orgName: organizations.name,
        orgAddress: organizations.address,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .innerJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .leftJoin(studentProfiles, eq(studentPosts.studentId, studentProfiles.userId))
      .where(and(eq(studentPosts.id, postId), isNull(studentPosts.deletedAt)))
      .limit(1);

    if (post.length === 0) {
      throw new NotFoundException('Post not found');
    }

    const target = post[0];

    // Fetch verifier display names
    let teacherVerifierName: string | null = null;
    if (target.teacherVerifiedBy) {
      const [tUser] = await this.db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, target.teacherVerifiedBy))
        .limit(1);
      teacherVerifierName = tUser?.fullName || null;
    }

    let orgVerifierName: string | null = null;
    if (target.orgVerifiedBy) {
      const [oUser] = await this.db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, target.orgVerifiedBy))
        .limit(1);
      orgVerifierName = oUser?.fullName || null;
    }

    // Transparent Fund Breakdown: Direct Donations vs Random Fund Allocations
    const [directDonationsRes] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${donations.amount}), '0.00')`,
        count: sql<number>`COUNT(${donations.id})`,
      })
      .from(donations)
      .where(
        and(
          eq(donations.postId, postId),
          eq(donations.status, 'accepted'),
          eq(donations.isRandom, false)
        )
      );

    const [randomAllocationsRes] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${fundAllocations.amount}), '0.00')`,
        count: sql<number>`COUNT(${fundAllocations.id})`,
      })
      .from(fundAllocations)
      .where(eq(fundAllocations.studentPostId, postId));

    // Donor's personal contribution history on this campaign
    let myDonations: any[] = [];
    if (currentUserId) {
      myDonations = await this.db
        .select({
          id: donations.id,
          amount: donations.amount,
          paymentMethod: donations.paymentMethod,
          transactionReference: donations.transactionReference,
          donorNote: donations.donorNote,
          status: donations.status,
          createdAt: donations.createdAt,
        })
        .from(donations)
        .where(and(eq(donations.postId, postId), eq(donations.donorId, currentUserId)))
        .orderBy(desc(donations.createdAt));
    }

    const expenses = await this.db
      .select()
      .from(studentPostExpenses)
      .where(eq(studentPostExpenses.postId, postId));

    // Fetch previous posts of this student
    const previousPosts = await this.db
      .select({
        id: studentPosts.id,
        title: studentPosts.title,
        problemDescription: studentPosts.problemDescription,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        verificationStatus: studentPosts.verificationStatus,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .where(
        and(
          eq(studentPosts.studentId, target.studentId),
          ne(studentPosts.id, postId),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.createdAt));

    return {
      ...target,
      totalRequiredAmount: Number(target.totalRequiredAmount),
      receivedAmount: Number(target.receivedAmount),
      remainingAmount: Number(target.remainingAmount),
      teacherVerifierName,
      orgVerifierName,
      fundingBreakdown: {
        directDonationsTotal: Number(directDonationsRes?.total || 0),
        directDonationsCount: Number(directDonationsRes?.count || 0),
        randomPoolAllocationsTotal: Number(randomAllocationsRes?.total || 0),
        randomPoolAllocationsCount: Number(randomAllocationsRes?.count || 0),
      },
      myDonations: myDonations.map((d) => ({
        ...d,
        amount: Number(d.amount),
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        categoryName: e.categoryName,
        amount: Number(e.amount),
      })),
      previousPosts: previousPosts.map((p) => ({
        ...p,
        totalRequiredAmount: Number(p.totalRequiredAmount),
        receivedAmount: Number(p.receivedAmount),
        remainingAmount: Number(p.remainingAmount),
      })),
      receivedItems: await this.db
        .select({
          id: itemDonations.id,
          itemName: itemDonations.itemName,
          description: itemDonations.description,
          quantity: itemDonations.quantity,
          status: itemDonations.status,
          deliveryStatus: itemDonations.deliveryStatus,
          donorName: itemDonations.donorName,
          adminFollowUpReply: itemDonations.adminFollowUpReply,
          createdAt: itemDonations.createdAt,
        })
        .from(itemDonations)
        .where(
          and(
            or(
              eq(itemDonations.postId, postId),
              eq(itemDonations.assignedStudentId, target.studentId)
            ),
            eq(itemDonations.status, 'accepted')
          )
        )
        .orderBy(desc(itemDonations.createdAt)),
    };
  }

  async listPublicVerifiedPosts() {
    const posts = await this.db
      .select({
        id: studentPosts.id,
        studentId: studentPosts.studentId,
        title: studentPosts.title,
        problemDescription: studentPosts.problemDescription,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        isDoubleVerified: studentPosts.isDoubleVerified,
        createdAt: studentPosts.createdAt,
        studentName: users.fullName,
        studentPhotoUrl: sql<string | null>`COALESCE(${studentProfiles.photoUrl}, ${users.avatarUrl})`,
        studentRoll: studentProfiles.studentClassRoll,
        orgName: organizations.name,
        orgAddress: organizations.address,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .innerJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .leftJoin(studentProfiles, eq(studentPosts.studentId, studentProfiles.userId))
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
        studentFullName: studentPosts.studentFullName,
        studentClassDepartment: studentPosts.studentClassDepartment,
        fatherName: studentPosts.fatherName,
        phone: studentPosts.phone,
        address: studentPosts.address,
        startDate: studentPosts.startDate,
        endDate: studentPosts.endDate,
        durationText: studentPosts.durationText,
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

  async listOrgHistoryPosts(orgUser: any) {
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
        receivedAmount: studentPosts.receivedAmount,
        teacherVerified: studentPosts.isTeacherVerified,
        orgVerified: studentPosts.isOrgVerified,
        isDoubleVerified: studentPosts.isDoubleVerified,
        status: studentPosts.verificationStatus,
        rejectionReason: studentPosts.rejectionReason,
        createdAt: studentPosts.createdAt,
        updatedAt: studentPosts.updatedAt,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .where(
        and(
          eq(studentPosts.organizationId, orgId),
          or(
            eq(studentPosts.isOrgVerified, true),
            eq(studentPosts.verificationStatus, 'rejected')
          ),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.updatedAt));

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
        receivedAmount: Number(p.receivedAmount || 0),
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
      // 1. Notify Super Admin & Master Admin (Filtered by Permission)
      await this.notificationsService.createNotification({
        recipientRole: 'admin',
        requiredPermission: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS,
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
    rejectionReason?: string,
    modifiedExpenses?: { categoryName: string; amount: number }[],
    modificationReason?: string
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

    const isExpensesModified =
      approved &&
      Array.isArray(modifiedExpenses) &&
      modifiedExpenses.length > 0;

    let newTotalAmount = Number(targetPost.totalRequiredAmount);
    const oldTotalAmount = Number(targetPost.totalRequiredAmount);

    if (isExpensesModified) {
      newTotalAmount = modifiedExpenses.reduce(
        (sum, item) => sum + Math.max(0, Number(item.amount) || 0),
        0
      );
      const newRemaining = Math.max(
        0,
        newTotalAmount - Number(targetPost.receivedAmount || 0)
      );

      await this.db.transaction(async (tx) => {
        // 1. Delete old expenses
        await tx
          .delete(studentPostExpenses)
          .where(eq(studentPostExpenses.postId, postId));

        // 2. Insert modified expenses
        for (const exp of modifiedExpenses) {
          await tx.insert(studentPostExpenses).values({
            postId,
            categoryName: exp.categoryName,
            amount: Number(exp.amount).toFixed(2),
          });
        }

        // 3. Update student post amounts, status, and adminModificationReason
        await tx
          .update(studentPosts)
          .set({
            totalRequiredAmount: newTotalAmount.toFixed(2),
            remainingAmount: newRemaining.toFixed(2),
            adminModificationReason: modificationReason || null,
            verificationStatus: PostVerificationStatus.APPROVED,
            superAdminApprovedBy: adminUser.id,
            isOrgVerified: autoVerifyOrg ? true : targetPost.isOrgVerified,
            rejectionReason: null,
          })
          .where(eq(studentPosts.id, postId));
      });
    } else {
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
    }

    // Send transparent notifications!
    const hasModifiedText = isExpensesModified && Boolean(modificationReason?.trim());
    const studentTitleBn = approved
      ? hasModifiedText
        ? 'আপনার আবেদনের খরচের বিভাজন সমন্বয় করে অনুমোদন করা হয়েছে'
        : 'অভিনন্দন! আপনার আবেদনটি লাইভ করা হয়েছে'
      : 'পোস্ট ছাড়পত্র প্রত্যাখ্যাত হয়েছে';

    const studentTitleEn = approved
      ? hasModifiedText
        ? 'Campaign Expenses Adjusted & Approved'
        : 'Campaign Approved & Live!'
      : 'Campaign Rejected by Admin';

    const studentMessageBn = approved
      ? hasModifiedText
        ? `এডমিন কর্তৃক আপনার পোস্ট "${targetPost.title}" এর খরচের বিভাজন সমন্বয় করা হয়েছে (পূর্বের মোট: ৳${oldTotalAmount.toLocaleString()}, সংশোধিত মোট: ৳${newTotalAmount.toLocaleString()})। কারণ: ${modificationReason}। আপনার আবেদনটি চূড়ান্ত অনুমোদন পেয়ে লাইভ হয়েছে।`
        : `আপনার শিক্ষা সহায়তা আবেদন "${targetPost.title}" চূড়ান্ত অনুমোদন পেয়েছে এবং অনুদানের জন্য লাইভ করা হয়েছে!`
      : `আপনার আবেদনটি এডমিন দ্বারা প্রত্যাখ্যাত হয়েছে। কারণ: ${rejectionReason || 'যথাযথ তথ্যের অভাব'}`;

    const studentMessageEn = approved
      ? hasModifiedText
        ? `Campaign "${targetPost.title}" expenses were adjusted by admin (Old: ৳${oldTotalAmount.toLocaleString()}, New: ৳${newTotalAmount.toLocaleString()}). Reason: ${modificationReason}. Campaign is now live.`
        : `Your student campaign "${targetPost.title}" has been approved and is now live for public donations!`
      : `Your application has been rejected by admin. Reason: ${rejectionReason || 'Incomplete details'}`;

    await this.notificationsService.createNotification({
      recipientUserId: targetPost.studentId,
      titleBn: studentTitleBn,
      titleEn: studentTitleEn,
      messageBn: studentMessageBn,
      messageEn: studentMessageEn,
      type: approved ? 'post_approved' : 'post_rejected',
      link: '/student?tab=applications',
    });

    if (targetPost.organizationId) {
      const orgTitleBn = approved
        ? hasModifiedText
          ? 'শিক্ষার্থীর পোস্টের খরচ সমন্বয় করে অনুমোদন দেওয়া হয়েছে'
          : 'শিক্ষার্থীর পোস্ট চূড়ান্ত অনুমোদিত'
        : 'শিক্ষার্থী পোস্ট ছাড়পত্র প্রত্যাখ্যাত';

      const orgTitleEn = approved
        ? hasModifiedText
          ? 'Student Campaign Expenses Adjusted & Approved'
          : 'Student Campaign Live'
        : 'Student Campaign Rejected';

      const orgMessageBn = approved
        ? hasModifiedText
          ? `আপনার প্রতিষ্ঠানের শিক্ষার্থী "${studentName}"-এর পোস্ট "${targetPost.title}"-এর খরচের বিভাজন এডমিন সমন্বয় করে অনুমোদন করেছেন (পূর্বের মোট: ৳${oldTotalAmount.toLocaleString()}, সংশোধিত মোট: ৳${newTotalAmount.toLocaleString()})। সমন্বয়ের কারণ: ${modificationReason}।`
          : `আপনার প্রতিষ্ঠানের শিক্ষার্থী "${studentName}"-এর পোস্ট "${targetPost.title}" এডমিন অনুমোদন দিয়েছেন।`
        : `পোস্ট "${targetPost.title}" এডমিন দ্বারা প্রত্যাখ্যাত হয়েছে।`;

      const orgMessageEn = approved
        ? hasModifiedText
          ? `Campaign expenses for student "${studentName}" were adjusted and approved by admin (Old: ৳${oldTotalAmount.toLocaleString()}, New: ৳${newTotalAmount.toLocaleString()}). Reason: ${modificationReason}.`
          : `Campaign "${targetPost.title}" for student "${studentName}" has been approved by admin.`
        : `Campaign "${targetPost.title}" was rejected by admin.`;

      await this.notificationsService.createNotification({
        recipientOrgId: targetPost.organizationId,
        titleBn: orgTitleBn,
        titleEn: orgTitleEn,
        messageBn: orgMessageBn,
        messageEn: orgMessageEn,
        type: approved ? 'post_approved' : 'post_rejected',
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

  async listSuperAdminPostsHistory() {
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
        receivedAmount: studentPosts.receivedAmount,
        teacherVerified: studentPosts.isTeacherVerified,
        orgVerified: studentPosts.isOrgVerified,
        status: studentPosts.verificationStatus,
        superAdminApprovedBy: studentPosts.superAdminApprovedBy,
        rejectionReason: studentPosts.rejectionReason,
        adminModificationReason: studentPosts.adminModificationReason,
        createdAt: studentPosts.createdAt,
        updatedAt: studentPosts.updatedAt,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .innerJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .where(
        and(
          inArray(studentPosts.verificationStatus, [
            PostVerificationStatus.APPROVED,
            PostVerificationStatus.REJECTED,
          ]),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(studentPosts.updatedAt), desc(studentPosts.createdAt));

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
        receivedAmount: Number(p.receivedAmount || 0),
        expenses: expenses.map((e) => ({
          category: e.category,
          amount: Number(e.amount),
        })),
      });
    }

    return result;
  }

  async listInstitutionPosts(currentUser: any) {
    let orgId = currentUser.organizationId;
    if (!orgId && currentUser.role === UserRole.TEACHER) {
      const [tp] = await this.db
        .select({ organizationId: teacherProfiles.organizationId })
        .from(teacherProfiles)
        .where(eq(teacherProfiles.userId, currentUser.id))
        .limit(1);
      if (tp) orgId = tp.organizationId;
    }
    if (!orgId) {
      const [found] = await this.db
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          or(
            eq(organizations.requestedByUserId, currentUser.id),
            eq(organizations.id, currentUser.id)
          )
        )
        .limit(1);
      if (found) orgId = found.id;
    }

    if (!orgId) return { live: [], history: [], all: [] };

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
        receivedAmount: studentPosts.receivedAmount,
        remainingAmount: studentPosts.remainingAmount,
        teacherVerified: studentPosts.isTeacherVerified,
        orgVerified: studentPosts.isOrgVerified,
        isDoubleVerified: studentPosts.isDoubleVerified,
        status: studentPosts.verificationStatus,
        rejectionReason: studentPosts.rejectionReason,
        createdAt: studentPosts.createdAt,
        updatedAt: studentPosts.updatedAt,
      })
      .from(studentPosts)
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .where(and(eq(studentPosts.organizationId, orgId), isNull(studentPosts.deletedAt)))
      .orderBy(desc(studentPosts.createdAt));

    const formatted = posts.map((p) => ({
      ...p,
      amount: Number(p.amount),
      receivedAmount: Number(p.receivedAmount || 0),
      remainingAmount: Number(p.remainingAmount || 0),
    }));

    const live = formatted.filter((p) => p.status === 'approved' || p.isDoubleVerified);
    const history = formatted.filter((p) => p.status !== 'approved' && !p.isDoubleVerified);

    return { live, history, all: formatted };
  }
}

