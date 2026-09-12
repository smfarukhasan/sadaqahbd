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
import { eq, and, isNull, desc } from 'drizzle-orm';
import {
  CreateStudentPostInput,
  PostVerificationStatus,
  UserRole,
} from '@sadaqahbd/schema';

@Injectable()
export class PostsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

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

    if (!studentUser.organizationId) {
      throw new BadRequestException('Student must be enrolled in an organization');
    }

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
        organizationId: studentUser.organizationId,
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

    return posts;
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
    const orgId = orgUser.role === UserRole.ORGANIZATION ? orgUser.id : orgUser.organizationId;
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
      .select()
      .from(studentPosts)
      .where(eq(studentPosts.id, postId))
      .limit(1);

    if (post.length === 0) throw new NotFoundException('Post not found');
    const targetPost = post[0];

    // Rule: Super Admin can view but CANNOT accept until organization has verified it!
    if (approved && !targetPost.isOrgVerified) {
      throw new BadRequestException(
        'Cannot approve post: Organization verification must be completed first'
      );
    }

    await this.db
      .update(studentPosts)
      .set({
        verificationStatus: approved
          ? PostVerificationStatus.APPROVED
          : PostVerificationStatus.REJECTED,
        superAdminApprovedBy: adminUser.id,
        rejectionReason: approved ? null : rejectionReason,
      })
      .where(eq(studentPosts.id, postId));

    return {
      success: true,
      message: approved
        ? 'Post approved and is now live for public donations'
        : 'Post rejected with reason provided',
    };
  }
}
