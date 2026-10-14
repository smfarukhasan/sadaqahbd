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
  users,
  userPermissions,
  organizations,
  studentProfiles,
  teacherProfiles,
  studentPosts,
  donations,
  itemDonations,
  institutionTransfers,
  complaints,
  orgMemberRemovals,
  fundAllocations,
} from '../../database';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { NotificationsService } from '../notifications/notifications.service';
import { eq, and, or, isNull, desc, sql, ne, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { hashPassword } from '../auth/password.util';
import {
  CreateAdminUserInput,
  CreateGeneralUserInput,
  StudentVerificationProfileInput,
  UserRole,
  UserRoleType,
  PermissionModuleKey,
} from '@sadaqahbd/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly notificationsService: NotificationsService
  ) {}

  async createAdminUser(creator: any, input: CreateAdminUserInput) {
    // Only Master Admin and Super Admin (with permission) can create admin users
    if (
      creator.role !== UserRole.MASTER_ADMIN &&
      creator.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only Master Admin or Super Admin can create admin users'
      );
    }

    // Super Admin cannot create another Super Admin unless creator is Master Admin or explicitly allowed
    if (
      input.role === UserRole.SUPER_ADMIN &&
      creator.role !== UserRole.MASTER_ADMIN
    ) {
      // check creator permissions for super admin creation
      const canManageSuper = creator.permissions?.some(
        (p: any) =>
          p.moduleKey === 'admin_users.super_admin_list' && p.canEdit
      );
      if (!canManageSuper) {
        throw new ForbiddenException(
          'You do not have permission to create Super Admins'
        );
      }
    }

    // 0. Pre-check if email or phone is already registered in MySQL
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone && input.phone.trim().length >= 6
      ? input.phone.trim().replace(/[\s-]/g, '')
      : null;

    const conditions = [eq(users.email, cleanEmail)];
    if (cleanPhone) {
      conditions.push(eq(users.phone, cleanPhone));
    }
    const [existingUser] = await this.db
      .select({ id: users.id, email: users.email, phone: users.phone })
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (existingUser) {
      if (existingUser.email.toLowerCase() === cleanEmail) {
        throw new BadRequestException('এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।');
      }
      throw new BadRequestException('এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।');
    }

    // 1. Optionally create or get user in Firebase Auth with default password 'pass1233'
    let fbUid: string | null = null;
    try {
      const fbUser = await this.firebaseAdmin.createOrUpdateUser({
        email: cleanEmail,
        password: 'pass1233',
        displayName: input.fullName.trim(),
        phoneNumber: cleanPhone || undefined,
      });
      fbUid = fbUser?.uid || null;
    } catch {
      // Firebase is auxiliary; MySQL is primary
    }

    const newUserId = randomUUID();

    try {
      // 2. Insert into MySQL users table with hashed default password
      await this.db.insert(users).values({
        id: newUserId,
        firebaseUid: fbUid,
        email: cleanEmail,
        phone: cleanPhone,
        fullName: input.fullName.trim(),
        role: input.role,
        status: 'active',
        passwordHash: hashPassword('pass1233'),
        isPasswordSet: true,
        mustChangePassword: true,
      });

      // 3. Save permissions if provided
      if (input.permissions && input.permissions.length > 0) {
        for (const p of input.permissions) {
          await this.db.insert(userPermissions).values({
            userId: newUserId,
            moduleKey: p.moduleKey,
            canView: p.canView,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
            canApprove: p.canApprove,
          });
        }
      }

      return {
        success: true,
        message: `${input.role} created successfully with default password pass1233`,
        userId: newUserId,
      };
    } catch (insertErr: any) {
      if (insertErr.code === 'ER_DUP_ENTRY' || insertErr.errno === 1062) {
        throw new BadRequestException('এই ইমেইল বা ফোন নম্বরটি ইতোমধ্যে ডাটাবেজে রয়েছে।');
      }
      throw new BadRequestException(`অ্যাকাউন্ট সংরক্ষণ করতে সমস্যা হয়েছে: ${insertErr.message || 'অজানা ত্রুটি'}`);
    }
  }

  async createGeneralUser(creator: any, input: CreateGeneralUserInput) {
    // Strict uniqueness check for email and phone
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone?.trim() ? input.phone.trim().replace(/[\s-]/g, '') : null;

    const conditions = [eq(users.email, cleanEmail)];
    if (cleanPhone) {
      conditions.push(eq(users.phone, cleanPhone));
    }
    const [existingUser] = await this.db
      .select({ id: users.id, email: users.email, phone: users.phone })
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (existingUser) {
      if (existingUser.email.toLowerCase() === cleanEmail) {
        throw new BadRequestException('এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।');
      }
      throw new BadRequestException('এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।');
    }

    const fbUser = await this.firebaseAdmin.createOrUpdateUser({
      email: cleanEmail,
      password: 'pass1233',
      displayName: input.fullName.trim(),
      phoneNumber: cleanPhone || undefined,
    });

    const newUserId = crypto.randomUUID();

    try {
      await this.db.insert(users).values({
        id: newUserId,
        firebaseUid: fbUser.uid,
        email: cleanEmail,
        phone: cleanPhone,
        fullName: input.fullName.trim(),
        role: input.role,
        organizationId: input.organizationId || null,
        status: 'active',
        isPasswordSet: true,
        mustChangePassword: true,
      });

      // Auto-create verified profile for students/teachers created directly by admin
      if (input.role === UserRole.STUDENT) {
        await this.db.insert(studentProfiles).values({
          id: randomUUID(),
          userId: newUserId,
          organizationId: input.organizationId || null,
          address: 'বাংলাদেশ',
          institutionName: 'অনুমোদিত শিক্ষা প্রতিষ্ঠান',
          studentClassRoll: 'নিয়মিত শিক্ষার্থী',
          verificationStatus: 'verified',
          adminApprovedAt: new Date(),
        });
      } else if (input.role === UserRole.TEACHER && input.organizationId) {
        await this.db.insert(teacherProfiles).values({
          id: randomUUID(),
          userId: newUserId,
          organizationId: input.organizationId,
          verificationStatus: 'verified',
          adminApprovedAt: new Date(),
        });
      }

      return {
        success: true,
        message: `${input.role} created successfully with default password pass1233`,
        userId: newUserId,
      };
    } catch (insertErr: any) {
      if (insertErr.code === 'ER_DUP_ENTRY' || insertErr.errno === 1062) {
        throw new BadRequestException('এই ইমেইল বা ফোন নম্বরটি ইতোমধ্যে ডাটাবেজে রয়েছে।');
      }
      throw new BadRequestException(`অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে: ${insertErr.message || 'অজানা ত্রুটি'}`);
    }
  }

  async listUsersByRole(role: UserRoleType, requester: any) {
    // Hide Master Admin from any other user
    let query = this.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        status: users.status,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, role), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));

    const result = await query;

    // Safety: filter out master admin if requester is not master admin
    if (requester.role !== UserRole.MASTER_ADMIN) {
      return result.filter((u) => u.role !== UserRole.MASTER_ADMIN);
    }

    return result;
  }

  /**
   * Check if user has active platform records (donations, posts, org campaigns, complaints, allocations, transfers).
   * In alignment with Platform Transparency & Integrity Policy:
   * Users with active financial, campaign, or audit records CANNOT be deleted via dashboard.
   * Only empty users with personal info only may be removed.
   */
  async checkUserPlatformData(targetUserId: string) {
    const target = await this.db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (target.length === 0) {
      throw new NotFoundException('ব্যবহারকারী পাওয়া যায়নি।');
    }

    const targetUser = target[0];
    const reasonsBn: string[] = [];
    const reasonsEn: string[] = [];

    // 1. Root / Master Admin
    if (targetUser.role === UserRole.MASTER_ADMIN) {
      reasonsBn.push('মাস্টার এডমিন অ্যাকাউন্ট সুরক্ষিত ও অপরিবর্তনযোগ্য');
      reasonsEn.push('Master Admin account is root-protected and immutable');
    }

    // 2. Financial Donations (Donor)
    const [donationsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(donations)
      .where(eq(donations.donorId, targetUserId));
    if (Number(donationsCount?.count || 0) > 0) {
      reasonsBn.push(`প্ল্যাটফর্মে ${donationsCount.count}টি আর্থিক অনুদান (সদাকাহ) রেকর্ড বিদ্যমান`);
      reasonsEn.push(`${donationsCount.count} financial donation record(s) exist on platform`);
    }

    // 3. Item Donations (Donor or Assigned Student)
    const [itemDonationsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(itemDonations)
      .where(
        or(
          eq(itemDonations.donorId, targetUserId),
          eq(itemDonations.assignedStudentId, targetUserId)
        )
      );
    if (Number(itemDonationsCount?.count || 0) > 0) {
      reasonsBn.push(`প্ল্যাটফর্মে ${itemDonationsCount.count}টি উপহার/বস্তুগত অনুদান রেকর্ড সংরক্ষিত`);
      reasonsEn.push(`${itemDonationsCount.count} non-monetary item donation record(s) exist`);
    }

    // 4. Student Aid Posts / Campaigns (as student or as verifier)
    const [postsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(studentPosts)
      .where(
        or(
          eq(studentPosts.studentId, targetUserId),
          eq(studentPosts.teacherVerifiedBy, targetUserId),
          eq(studentPosts.orgVerifiedBy, targetUserId),
          eq(studentPosts.superAdminApprovedBy, targetUserId)
        )
      );
    if (Number(postsCount?.count || 0) > 0) {
      reasonsBn.push(`প্ল্যাটফর্মে ${postsCount.count}টি শিক্ষার্থী সাহায্য আবেদন/পোস্ট বা ভেরিফিকেশন রেকর্ড রয়েছে`);
      reasonsEn.push(`${postsCount.count} student aid campaign/verification record(s) exist`);
    }

    // 5. Organization involvement:
    // If user is organization owner or represents an organization that has posts, teachers, or students
    if (targetUser.role === UserRole.ORGANIZATION || targetUser.organizationId) {
      const orgId = targetUser.organizationId;
      if (orgId) {
        const [orgPosts] = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(studentPosts)
          .where(eq(studentPosts.organizationId, orgId));
        if (Number(orgPosts?.count || 0) > 0) {
          reasonsBn.push(`সংশ্লিষ্ট শিক্ষা প্রতিষ্ঠানের অধীনে ${orgPosts.count}টি শিক্ষার্থীর সক্রিয় পোস্ট/ক্যাম্পেইন রয়েছে`);
          reasonsEn.push(`Organization has ${orgPosts.count} student campaign(s) linked to it`);
        }
      }
      // Or if user requested an organization
      const [requestedOrgs] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(organizations)
        .where(eq(organizations.requestedByUserId, targetUserId));
      if (Number(requestedOrgs?.count || 0) > 0) {
        reasonsBn.push(`শিক্ষা প্রতিষ্ঠান নিবন্ধন বা অধিভুক্তির আবেদন রেকর্ড রয়েছে`);
        reasonsEn.push(`Organization registration request records exist`);
      }
    }

    // 6. Complaints & Reports
    const [complaintsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(complaints)
      .where(
        or(
          eq(complaints.senderId, targetUserId),
          eq(complaints.repliedBy, targetUserId)
        )
      );
    if (Number(complaintsCount?.count || 0) > 0) {
      reasonsBn.push(`প্ল্যাটফর্মে ${complaintsCount.count}টি অভিযোগ/রিপোর্ট সংক্রান্ত অডিট রেকর্ড রয়েছে`);
      reasonsEn.push(`${complaintsCount.count} complaint or dispute record(s) exist on platform`);
    }

    // 7. Fund Allocations (disbursing or receiving)
    const [allocationsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(fundAllocations)
      .where(eq(fundAllocations.allocatedBy, targetUserId));
    if (Number(allocationsCount?.count || 0) > 0) {
      reasonsBn.push(`প্ল্যাটফর্ম র‍্যান্ডম ফান্ড থেকে অর্থ বরাদ্দের অডিট ট্রেইল বিদ্যমান`);
      reasonsEn.push(`Random pool fund allocation records exist`);
    }

    // 8. Institution Transfers
    const [transfersCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(institutionTransfers)
      .where(
        or(
          eq(institutionTransfers.userId, targetUserId),
          eq(institutionTransfers.currentOrgApprovedBy, targetUserId),
          eq(institutionTransfers.targetOrgApprovedBy, targetUserId),
          eq(institutionTransfers.finalApprovedBy, targetUserId)
        )
      );
    if (Number(transfersCount?.count || 0) > 0) {
      reasonsBn.push(`প্রতিষ্ঠান পরিবর্তন (ট্রান্সফার) সংক্রান্ত অডিট ট্রেইল বিদ্যমান`);
      reasonsEn.push(`Institution transfer records exist`);
    }

    // 9. Member Removal records
    const [removalsCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(orgMemberRemovals)
      .where(
        or(
          eq(orgMemberRemovals.userId, targetUserId),
          eq(orgMemberRemovals.requestedByUserId, targetUserId),
          eq(orgMemberRemovals.adminReviewedBy, targetUserId)
        )
      );
    if (Number(removalsCount?.count || 0) > 0) {
      reasonsBn.push(`সদস্য রিমুভাল সংক্রান্ত আবেদন বা অডিট রেকর্ড বিদ্যমান`);
      reasonsEn.push(`Member removal audit records exist`);
    }

    const hasPlatformData = reasonsBn.length > 0;

    return {
      canDelete: !hasPlatformData,
      hasPlatformData,
      user: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        status: targetUser.status,
      },
      reasonsBn,
      reasonsEn,
      policyNoticeBn: 'প্ল্যাটফর্মের স্বচ্ছতা ও সততার স্বার্থে কোনো তথ্য বা অডিট রেকর্ড যুক্ত থাকা অ্যাকাউন্ট ড্যাশবোর্ড থেকে ডিলিট করা সম্পূর্ণ নিষিদ্ধ। শুধুমাত্র ব্যক্তিগত তথ্যসম্পন্ন খালি অ্যাকাউন্ট ডিলিটযোগ্য। কোনো বিশেষ রেকর্ড অপসারণের প্রয়োজনে প্ল্যাটফর্ম প্রযুক্তি পরিচালনাকারী সফটওয়্যার কোম্পানির সাথে যোগাযোগ করতে হবে।',
      policyNoticeEn: 'For platform transparency and audit integrity, deleting accounts linked to active records or transactions is strictly prohibited. Only empty accounts with purely personal information may be deleted. For extraordinary data removal requests, please contact the software development company.',
    };
  }

  async deleteUser(targetUserId: string, requester: any) {
    const eligibility = await this.checkUserPlatformData(targetUserId);

    // Strict Platform Transparency & Integrity Policy Enforced:
    if (eligibility.hasPlatformData || !eligibility.canDelete) {
      const reasonsList = eligibility.reasonsBn.join(', ');
      throw new ForbiddenException(
        `[প্ল্যাটফর্ম সততা ও স্বচ্ছতা সুরক্ষা নীতি]: এই অ্যাকাউন্টের সাথে গুরুত্বপূর্ণ প্ল্যাটফর্ম রেকর্ড সংরক্ষিত থাকায় এটি ড্যাশবোর্ড থেকে ডিলিট করা সম্পূর্ণ নিষিদ্ধ (${reasonsList})। প্ল্যাটফর্মের স্বচ্ছতা ও সততার স্বার্থে শুধুমাত্র কোনো প্রকার লেনদেন বা পোস্ট ছাড়া ব্যক্তিগত তথ্যসম্পন্ন খালি অ্যাকাউন্ট ডিলিটযোগ্য। কোনো বিশেষ ডাটা রিমুভ করার প্রয়োজন হলে প্ল্যাটফর্ম প্রযুক্তি পরিচালনাকারী সফটওয়্যার কোম্পানির সাথে যোগাযোগ করতে হবে।`
      );
    }

    const targetUser = eligibility.user;

    // Master Admin cannot be deleted by ANYONE
    if (targetUser.role === UserRole.MASTER_ADMIN) {
      throw new ForbiddenException('মাস্টার এডমিন অ্যাকাউন্ট সুরক্ষিত ও অপরিবর্তনযোগ্য।');
    }

    // Super Admin can delete users if permitted, but cannot delete another Super Admin unless permitted
    if (targetUser.role === UserRole.SUPER_ADMIN && requester.role !== UserRole.MASTER_ADMIN) {
      const canDeleteSuper = requester.permissions?.some(
        (p: any) =>
          p.moduleKey === 'admin_users.super_admin_list' && p.canDelete
      );
      if (!canDeleteSuper) {
        throw new ForbiddenException('সুপার এডমিন অ্যাকাউন্ট ডিলিট করার অনুমতি আপনার নেই।');
      }
    }

    // Soft delete purely personal empty accounts
    await this.db
      .update(users)
      .set({ deletedAt: new Date(), status: 'suspended' })
      .where(eq(users.id, targetUserId));

    return { success: true, message: 'ব্যক্তিগত তথ্যসম্পন্ন অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।' };
  }

  async submitStudentProfile(studentUser: any, input: StudentVerificationProfileInput) {
    const existing = await this.db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentUser.id))
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(studentProfiles)
        .set({
          ...input,
          verificationStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(studentProfiles.userId, studentUser.id));
    } else {
      await this.db.insert(studentProfiles).values({
        id: crypto.randomUUID(),
        userId: studentUser.id,
        ...input,
        verificationStatus: 'pending',
      });
    }

    return { success: true, message: 'Student verification profile submitted' };
  }

  async verifyStudentProfile(
    studentUserId: string,
    verifiedByOrgUser: any,
    approved: boolean
  ) {
    await this.db
      .update(studentProfiles)
      .set({
        verificationStatus: approved ? 'verified' : 'rejected',
        verifiedByOrgUserId: verifiedByOrgUser.id,
        verifiedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, studentUserId));

    return {
      success: true,
      message: `Student profile ${approved ? 'verified' : 'rejected'} successfully`,
    };
  }

  async listPendingOrgRequests() {
    const orgs = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        regNo: organizations.registrationNumber,
        contact: organizations.contactPerson,
        phone: organizations.contactPhone,
        address: organizations.address,
        email: organizations.email,
        type: organizations.type,
        description: organizations.description,
        isRequestedByMember: organizations.isRequestedByMember,
        requestedByUserId: organizations.requestedByUserId,
        requesterName: users.fullName,
        requesterRole: users.role,
        requesterEmail: users.email,
        status: organizations.status,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.requestedByUserId, users.id))
      .where(and(eq(organizations.status, 'pending'), isNull(organizations.deletedAt)))
      .orderBy(desc(organizations.createdAt));

    return orgs;
  }

  async listOrgRequestsHistory() {
    const orgs = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        regNo: organizations.registrationNumber,
        contact: organizations.contactPerson,
        phone: organizations.contactPhone,
        address: organizations.address,
        email: organizations.email,
        type: organizations.type,
        description: organizations.description,
        isRequestedByMember: organizations.isRequestedByMember,
        status: organizations.status,
        verifiedBy: organizations.verifiedBy,
        verifiedAt: organizations.verifiedAt,
        verifierName: users.fullName,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.verifiedBy, users.id))
      .where(and(inArray(organizations.status, ['active', 'rejected']), isNull(organizations.deletedAt)))
      .orderBy(desc(organizations.verifiedAt), desc(organizations.createdAt));

    return orgs;
  }

  async verifyOrganization(
    orgId: string,
    reviewer: any,
    approved: boolean,
    reason?: string,
    editData?: any
  ) {
    const newStatus = approved ? 'active' : 'rejected';

    const updatePayload: any = {
      status: newStatus,
      verifiedBy: reviewer.id,
      verifiedAt: new Date(),
    };

    if (editData) {
      if (editData.name && String(editData.name).trim()) {
        updatePayload.name = String(editData.name).trim();
      }
      if (editData.type && String(editData.type).trim()) {
        updatePayload.type = String(editData.type).trim();
      }
      if (editData.contactPhone && String(editData.contactPhone).trim()) {
        updatePayload.contactPhone = String(editData.contactPhone).trim();
      } else if (editData.phone && String(editData.phone).trim()) {
        updatePayload.contactPhone = String(editData.phone).trim();
      }
      if (editData.contactPerson && String(editData.contactPerson).trim()) {
        updatePayload.contactPerson = String(editData.contactPerson).trim();
      } else if (editData.contact && String(editData.contact).trim()) {
        updatePayload.contactPerson = String(editData.contact).trim();
      }
      if (editData.address && String(editData.address).trim()) {
        updatePayload.address = String(editData.address).trim();
      }
      if (editData.registrationNumber && String(editData.registrationNumber).trim()) {
        updatePayload.registrationNumber = String(editData.registrationNumber).trim();
      } else if (editData.regNo && String(editData.regNo).trim()) {
        updatePayload.registrationNumber = String(editData.regNo).trim();
      }
      if (editData.email !== undefined) {
        updatePayload.email = editData.email ? String(editData.email).trim() : null;
      }
      if (editData.description !== undefined) {
        updatePayload.description = String(editData.description).trim() || null;
      }
    }

    await this.db
      .update(organizations)
      .set(updatePayload)
      .where(eq(organizations.id, orgId));

    const [org] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (approved) {
      if (editData?.assignedUserId || org?.isRequestedByMember) {
        const assignedUserId = editData?.assignedUserId;
        if (!assignedUserId && org?.isRequestedByMember) {
          throw new BadRequestException('সাধারণ সদস্য কর্তৃক প্রস্তাবিত প্রতিষ্ঠানের জন্য একজন অর্গানাইজেশন ইউজার অ্যাকাউন্ট নির্ধারণ করা আবশ্যক।');
        }

        if (assignedUserId) {
          const [assignedUser] = await this.db
            .select()
            .from(users)
            .where(and(eq(users.id, assignedUserId), isNull(users.deletedAt)))
            .limit(1);

          if (!assignedUser) {
            throw new NotFoundException('নির্বাচিত অর্গানাইজেশন ইউজার অ্যাকাউন্টটি পাওয়া যায়নি।');
          }

          // Bind user to organization and activate
          await this.db
            .update(users)
            .set({
              organizationId: orgId,
              status: 'active',
              updatedAt: new Date(),
            })
            .where(eq(users.id, assignedUserId));

          // Notify assigned organization user
          await this.notificationsService.createNotification({
            recipientUserId: assignedUserId,
            titleBn: 'প্রতিষ্ঠান অ্যাকাউন্টের দায়িত্ব অর্পণ ও অনুমোদন',
            titleEn: 'Organization Authority Assigned & Approved',
            messageBn: `আপনাকে "${org.name}" শিক্ষা প্রতিষ্ঠানের প্রাতিষ্ঠানিক অথরিটি হিসেবে নির্ধারণ করা হয়েছে। এখন আপনি ড্যাশবোর্ডে লগইন করে পরিচালনা করতে পারবেন।`,
            messageEn: `You have been assigned as the authority for "${org.name}". You can now access and manage your portal.`,
            type: 'org_verification',
            link: '/organization',
          });

          // Notify proposing member (student/teacher)
          if (org.requestedByUserId && org.isRequestedByMember) {
            await this.notificationsService.createNotification({
              recipientUserId: org.requestedByUserId,
              titleBn: 'প্রস্তাবিত প্রতিষ্ঠান অনুমোদিত হয়েছে!',
              titleEn: 'Proposed Institution Approved!',
              messageBn: `আপনার প্রস্তাবিত প্রতিষ্ঠান "${org.name}" সফলভাবে অনুমোদিত হয়েছে এবং প্রাতিষ্ঠানিক অ্যাকাউন্ট নির্ধারণ করা হয়েছে।`,
              messageEn: `Your proposed institution "${org.name}" has been approved by authority.`,
              type: 'org_verification',
              link: '/dashboard',
            });
          }
        }
      } else if (org && org.requestedByUserId) {
        // Standard organization account self-application
        await this.db
          .update(users)
          .set({
            status: 'active',
            organizationId: orgId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, org.requestedByUserId));

        await this.notificationsService.createNotification({
          recipientUserId: org.requestedByUserId,
          titleBn: 'প্রতিষ্ঠান অনুমোদিত হয়েছে!',
          titleEn: 'Organization Approved!',
          messageBn: `আপনার প্রতিষ্ঠান "${org.name}" সফলভাবে অনুমোদিত হয়েছে। এখন ড্যাশবোর্ডের সব ফিচার সচল।`,
          messageEn: `Your organization "${org.name}" has been approved. All dashboard features are now unlocked.`,
          type: 'org_verification',
          link: '/organization',
        });
      }
    } else {
      // Rejection
      if (org && org.requestedByUserId) {
        await this.notificationsService.createNotification({
          recipientUserId: org.requestedByUserId,
          titleBn: 'প্রতিষ্ঠান আবেদন প্রত্যাখ্যাত',
          titleEn: 'Organization Rejected',
          messageBn: `আপনার প্রতিষ্ঠানের আবেদনটি এডমিন দ্বারা প্রত্যাখ্যাত হয়েছে। কারণ: ${reason || 'যথাযথ তথ্য পাওয়া যায়নি'}`,
          messageEn: `Your organization application has been rejected. Reason: ${reason || 'Incomplete details'}`,
          type: 'org_verification',
          link: '/organization',
        });
      }
    }

    return {
      success: true,
      message: `Organization ${approved ? 'approved and activated' : 'rejected'} successfully`,
    };
  }

  async listOrgTeachers(orgUser: any) {
    const orgId =
      orgUser.role === UserRole.ORGANIZATION ? orgUser.id : orgUser.organizationId;
    if (!orgId) return [];

    return this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.TEACHER),
          eq(users.organizationId, orgId),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async verifyTeacher(orgUser: any, teacherId: string, approved: boolean) {
    const orgId =
      orgUser.role === UserRole.ORGANIZATION ? orgUser.id : orgUser.organizationId;
    const newStatus = approved ? 'active' : 'rejected';

    if (orgUser.role !== UserRole.MASTER_ADMIN && !orgId) {
      throw new ForbiddenException('Organization ID missing');
    }

    const whereClause =
      orgUser.role === UserRole.MASTER_ADMIN
        ? eq(users.id, teacherId)
        : and(eq(users.id, teacherId), eq(users.organizationId, orgId));

    await this.db
      .update(users)
      .set({ status: newStatus })
      .where(whereClause);

    return {
      success: true,
      message: approved ? 'Teacher approved successfully' : 'Teacher rejected',
    };
  }

  async applyAffiliation(currentUser: any, dto: {
    organizationId: string;
    department?: string;
    designation?: string;
    employeeId?: string;
    studentClassRoll?: string;
    address?: string;
    phone?: string;
  }) {
    if (!dto.organizationId) {
      throw new BadRequestException('অনুগ্রহ করে একটি প্রতিষ্ঠান নির্বাচন করুন।');
    }

    const [org] = await this.db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, dto.organizationId), isNull(organizations.deletedAt)))
      .limit(1);

    if (!org) {
      throw new NotFoundException('নির্বাচিত প্রতিষ্ঠানটি খুঁজে পাওয়া যায়নি।');
    }

    if (currentUser.role === UserRole.TEACHER) {
      const [existing] = await this.db
        .select()
        .from(teacherProfiles)
        .where(eq(teacherProfiles.userId, currentUser.id))
        .limit(1);

      if (existing) {
        await this.db
          .update(teacherProfiles)
          .set({
            organizationId: dto.organizationId,
            department: dto.department?.trim() || null,
            designation: dto.designation?.trim() || null,
            employeeId: dto.employeeId?.trim() || null,
            verificationStatus: 'pending_org',
            rejectionReason: null,
            updatedAt: new Date(),
          })
          .where(eq(teacherProfiles.id, existing.id));
      } else {
        await this.db.insert(teacherProfiles).values({
          id: randomUUID(),
          userId: currentUser.id,
          organizationId: dto.organizationId,
          department: dto.department?.trim() || null,
          designation: dto.designation?.trim() || null,
          employeeId: dto.employeeId?.trim() || null,
          verificationStatus: 'pending_org',
        });
      }

      const teacherUserUpdate: any = { organizationId: dto.organizationId, status: 'pending' };
      if (dto.phone && String(dto.phone).trim().length >= 6) {
        teacherUserUpdate.phone = String(dto.phone).trim().replace(/[\s-]/g, '');
      }
      await this.db
        .update(users)
        .set(teacherUserUpdate)
        .where(eq(users.id, currentUser.id));

      // Notify the Organization
      await this.notificationsService.createNotification({
        recipientOrgId: dto.organizationId,
        recipientRole: 'organization',
        titleBn: 'নতুন শিক্ষকের ভেরিফিকেশন আবেদন',
        titleEn: 'New Teacher Affiliation Request',
        messageBn: `শিক্ষক "${currentUser.fullName}" আপনার প্রতিষ্ঠানের সাথে যুক্ত হওয়ার আবেদন করেছেন।`,
        messageEn: `Teacher "${currentUser.fullName}" submitted an affiliation request to your organization.`,
        type: 'teacher_affiliation',
        link: '/organization?tab=affiliations',
      });

      // Notify Super Admins and Master Admin (Filtered by Permission)
      await this.notificationsService.createNotification({
        recipientRole: 'admin',
        requiredPermission: PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS,
        titleBn: 'শিক্ষকের প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন',
        titleEn: 'Teacher Affiliation Submitted',
        messageBn: `শিক্ষক "${currentUser.fullName}" ("${org.name}") প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন করেছেন।`,
        messageEn: `Teacher "${currentUser.fullName}" applied to join "${org.name}".`,
        type: 'teacher_affiliation',
        link: '/admin?tab=affiliation_requests',
      });

      return {
        success: true,
        message: 'প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন সফলভাবে জমা হয়েছে। প্রতিষ্ঠান ও এডমিন অনুমোদনের অপেক্ষায় রয়েছে।',
        verificationStatus: 'pending_org',
      };
    } else if (currentUser.role === UserRole.STUDENT) {
      const studentRoll = dto.studentClassRoll?.trim() || 'নিয়মিত শিক্ষার্থী';

      const [existing] = await this.db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, currentUser.id))
        .limit(1);

      if (existing) {
        await this.db
          .update(studentProfiles)
          .set({
            organizationId: dto.organizationId,
            institutionName: org.name,
            studentClassRoll: studentRoll,
            address: dto.address?.trim() || existing.address || 'বাংলাদেশ',
            verificationStatus: 'pending_org',
            rejectionReason: null,
            updatedAt: new Date(),
          })
          .where(eq(studentProfiles.id, existing.id));
      } else {
        await this.db.insert(studentProfiles).values({
          id: randomUUID(),
          userId: currentUser.id,
          organizationId: dto.organizationId,
          institutionName: org.name,
          studentClassRoll: studentRoll,
          address: dto.address?.trim() || currentUser.address || 'বাংলাদেশ',
          verificationStatus: 'pending_org',
        });
      }

      const studentUserUpdate: any = { organizationId: dto.organizationId, status: 'pending' };
      if (dto.phone && String(dto.phone).trim().length >= 6) {
        studentUserUpdate.phone = String(dto.phone).trim().replace(/[\s-]/g, '');
      }
      await this.db
        .update(users)
        .set(studentUserUpdate)
        .where(eq(users.id, currentUser.id));

      // Notify the Organization
      await this.notificationsService.createNotification({
        recipientOrgId: dto.organizationId,
        recipientRole: 'organization',
        titleBn: 'নতুন শিক্ষার্থীর ভেরিফিকেশন আবেদন',
        titleEn: 'New Student Affiliation Request',
        messageBn: `শিক্ষার্থী "${currentUser.fullName}" আপনার প্রতিষ্ঠানের সাথে যুক্ত হওয়ার আবেদন করেছেন।`,
        messageEn: `Student "${currentUser.fullName}" applied to your institution.`,
        type: 'student_affiliation',
        link: '/organization?tab=affiliations',
      });

      // Notify Super Admins and Master Admin (Filtered by Permission)
      await this.notificationsService.createNotification({
        recipientRole: 'admin',
        requiredPermission: PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS,
        titleBn: 'শিক্ষার্থীর প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন',
        titleEn: 'Student Affiliation Submitted',
        messageBn: `শিক্ষার্থী "${currentUser.fullName}" ("${org.name}") প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন করেছেন।`,
        messageEn: `Student "${currentUser.fullName}" applied to join "${org.name}".`,
        type: 'student_affiliation',
        link: '/admin?tab=affiliation_requests',
      });

      return {
        success: true,
        message: 'প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন সফলভাবে জমা হয়েছে। প্রতিষ্ঠান ও এডমিন অনুমোদনের অপেক্ষায় রয়েছে।',
        verificationStatus: 'pending_org',
      };
    } else {
      throw new BadRequestException('শুধুমাত্র শিক্ষক ও শিক্ষার্থীরা প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন করতে পারবেন।');
    }
  }

  async getMyAffiliation(currentUser: any) {
    if (currentUser.role === UserRole.TEACHER) {
      const [profile] = await this.db
        .select({
          profileId: teacherProfiles.id,
          department: teacherProfiles.department,
          designation: teacherProfiles.designation,
          employeeId: teacherProfiles.employeeId,
          verificationStatus: teacherProfiles.verificationStatus,
          rejectionReason: teacherProfiles.rejectionReason,
          orgApprovedAt: teacherProfiles.orgApprovedAt,
          adminApprovedAt: teacherProfiles.adminApprovedAt,
          organizationId: teacherProfiles.organizationId,
          orgName: organizations.name,
          orgAddress: organizations.address,
        })
        .from(teacherProfiles)
        .leftJoin(organizations, eq(teacherProfiles.organizationId, organizations.id))
        .where(eq(teacherProfiles.userId, currentUser.id))
        .limit(1);

      const status = profile?.verificationStatus || 'unapplied';

      return {
        hasApplied: !!profile,
        profile: profile || null,
        status,
        organization: profile ? { id: profile.organizationId, name: profile.orgName } : null,
      };
    } else if (currentUser.role === UserRole.STUDENT) {
      const [profile] = await this.db
        .select({
          profileId: studentProfiles.id,
          studentClassRoll: studentProfiles.studentClassRoll,
          address: studentProfiles.address,
          institutionName: studentProfiles.institutionName,
          verificationStatus: studentProfiles.verificationStatus,
          rejectionReason: studentProfiles.rejectionReason,
          orgApprovedAt: studentProfiles.orgApprovedAt,
          adminApprovedAt: studentProfiles.adminApprovedAt,
          organizationId: studentProfiles.organizationId,
          orgName: organizations.name,
          orgAddress: organizations.address,
        })
        .from(studentProfiles)
        .leftJoin(organizations, eq(studentProfiles.organizationId, organizations.id))
        .where(eq(studentProfiles.userId, currentUser.id))
        .limit(1);

      const status = profile?.verificationStatus || 'unapplied';

      return {
        hasApplied: !!profile,
        profile: profile || null,
        status,
        organization: profile ? { id: profile.organizationId, name: profile.orgName || profile.institutionName } : null,
      };
    }

    return { hasApplied: false, profile: null, status: 'unapplied', organization: null };
  }

  async listPendingAdminAffiliations() {
    const teachers = await this.db
      .select({
        profileId: teacherProfiles.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        department: teacherProfiles.department,
        designation: teacherProfiles.designation,
        employeeId: teacherProfiles.employeeId,
        verificationStatus: teacherProfiles.verificationStatus,
        orgApprovedAt: teacherProfiles.orgApprovedAt,
        orgId: organizations.id,
        orgName: organizations.name,
        createdAt: teacherProfiles.createdAt,
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .innerJoin(organizations, eq(teacherProfiles.organizationId, organizations.id))
      .where(
        and(
          eq(teacherProfiles.verificationStatus, 'pending_admin'),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(teacherProfiles.createdAt));

    const students = await this.db
      .select({
        profileId: studentProfiles.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        studentClassRoll: studentProfiles.studentClassRoll,
        address: studentProfiles.address,
        institutionName: studentProfiles.institutionName,
        verificationStatus: studentProfiles.verificationStatus,
        orgApprovedAt: studentProfiles.orgApprovedAt,
        orgId: organizations.id,
        orgName: organizations.name,
        createdAt: studentProfiles.createdAt,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .innerJoin(organizations, eq(studentProfiles.organizationId, organizations.id))
      .where(
        and(
          eq(studentProfiles.verificationStatus, 'pending_admin'),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(studentProfiles.createdAt));

    const memberSuggestedOrgs = await this.db
      .select({
        orgId: organizations.id,
        name: organizations.name,
        address: organizations.address,
        contactPhone: organizations.contactPhone,
        type: organizations.type,
        description: organizations.description,
        requestedByUserId: organizations.requestedByUserId,
        requesterName: users.fullName,
        requesterRole: users.role,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.requestedByUserId, users.id))
      .where(
        and(
          eq(organizations.isRequestedByMember, true),
          eq(organizations.status, 'pending'),
          isNull(organizations.deletedAt)
        )
      )
      .orderBy(desc(organizations.createdAt));

    return {
      teachers,
      students,
      memberSuggestedOrgs,
    };
  }

  async listAdminAffiliationsHistory() {
    const teachers = await this.db
      .select({
        profileId: teacherProfiles.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        department: teacherProfiles.department,
        designation: teacherProfiles.designation,
        employeeId: teacherProfiles.employeeId,
        verificationStatus: teacherProfiles.verificationStatus,
        adminApprovedAt: teacherProfiles.adminApprovedAt,
        adminApprovedBy: teacherProfiles.adminApprovedBy,
        rejectionReason: teacherProfiles.rejectionReason,
        orgId: organizations.id,
        orgName: organizations.name,
        createdAt: teacherProfiles.createdAt,
        updatedAt: teacherProfiles.updatedAt,
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .innerJoin(organizations, eq(teacherProfiles.organizationId, organizations.id))
      .where(
        and(
          inArray(teacherProfiles.verificationStatus, ['verified', 'rejected']),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(teacherProfiles.adminApprovedAt), desc(teacherProfiles.updatedAt));

    const students = await this.db
      .select({
        profileId: studentProfiles.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        studentClassRoll: studentProfiles.studentClassRoll,
        address: studentProfiles.address,
        institutionName: studentProfiles.institutionName,
        fatherName: studentProfiles.fatherName,
        className: studentProfiles.className,
        department: studentProfiles.department,
        rollNumber: studentProfiles.rollNumber,
        guardianName: studentProfiles.guardianName,
        guardianPhone: studentProfiles.guardianPhone,
        verificationStatus: studentProfiles.verificationStatus,
        adminApprovedAt: studentProfiles.adminApprovedAt,
        adminApprovedBy: studentProfiles.adminApprovedBy,
        rejectionReason: studentProfiles.rejectionReason,
        orgId: organizations.id,
        orgName: organizations.name,
        createdAt: studentProfiles.createdAt,
        updatedAt: studentProfiles.updatedAt,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .innerJoin(organizations, eq(studentProfiles.organizationId, organizations.id))
      .where(
        and(
          inArray(studentProfiles.verificationStatus, ['verified', 'rejected']),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(studentProfiles.adminApprovedAt), desc(studentProfiles.updatedAt));

    return {
      teachers,
      students,
    };
  }

  async reviewAdminAffiliation(
    currentUser: any,
    role: 'teacher' | 'student',
    profileId: string,
    approved: boolean,
    reason?: string
  ) {
    const finalStatus = approved ? 'verified' : 'rejected';

    if (role === 'teacher') {
      const [record] = await this.db
        .select({ profile: teacherProfiles, user: users })
        .from(teacherProfiles)
        .innerJoin(users, eq(teacherProfiles.userId, users.id))
        .where(eq(teacherProfiles.id, profileId))
        .limit(1);

      if (!record) throw new NotFoundException('শিক্ষক প্রোফাইল পাওয়া যায়নি।');

      await this.db
        .update(teacherProfiles)
        .set({
          verificationStatus: finalStatus,
          adminApprovedBy: currentUser.id,
          adminApprovedAt: new Date(),
          rejectionReason: approved ? null : reason,
        })
        .where(eq(teacherProfiles.id, profileId));

      await this.db
        .update(users)
        .set({ status: approved ? 'active' : 'rejected' })
        .where(eq(users.id, record.user.id));

      // Notify the teacher user
      await this.notificationsService.createNotification({
        recipientUserId: record.user.id,
        titleBn: approved
          ? 'অভিনন্দন! শিক্ষক ভেরিফিকেশন অনুমোদিত হয়েছে'
          : 'শিক্ষক ভেরিফিকেশন আবেদন প্রত্যাখ্যাত',
        titleEn: approved ? 'Teacher Verification Approved' : 'Teacher Verification Rejected',
        messageBn: approved
          ? 'আপনার শিক্ষক অ্যাকাউন্টটি সফলভাবে ভেরিফাইড হয়েছে। এখন আপনি সকল ফিচার ব্যবহার করতে পারবেন।'
          : `আপনার শিক্ষক অ্যাকাউন্ট ভেরিফিকেশন আবেদন বাতিল করা হয়েছে। কারণ: ${reason || 'প্রদত্ত তথ্য অসঙ্গতিপূর্ণ'}`,
        messageEn: approved
          ? 'Your teacher account has been verified successfully. All features are now unlocked.'
          : `Your teacher verification request was rejected. Reason: ${reason || 'Inconsistent information'}`,
        type: 'teacher_verification_result',
        link: '/teacher',
      });

      if (approved && record.profile.organizationId) {
        await this.notificationsService.createNotification({
          recipientOrgId: record.profile.organizationId,
          titleBn: 'শিক্ষক অনুমোদন সম্পন্ন!',
          titleEn: 'Teacher Affiliation Approved by Admin',
          messageBn: `আপনার প্রতিষ্ঠানের শিক্ষক "${record.user.fullName}" এডমিন কর্তৃক চূড়ান্তভাবে অনুমোদিত হয়েছেন।`,
          messageEn: `Teacher "${record.user.fullName}" was granted final approval by administrator.`,
          type: 'teacher_affiliation_approved',
          link: '/organization?tab=teachers',
        });
      }

      return {
        success: true,
        message: approved ? 'শিক্ষক সফলভাবে অনুমোদিত ও অ্যাক্টিভ হয়েছে।' : 'শিক্ষকের আবেদন বাতিল করা হয়েছে।',
      };
    } else {
      const [record] = await this.db
        .select({ profile: studentProfiles, user: users })
        .from(studentProfiles)
        .innerJoin(users, eq(studentProfiles.userId, users.id))
        .where(eq(studentProfiles.id, profileId))
        .limit(1);

      if (!record) throw new NotFoundException('শিক্ষার্থী প্রোফাইল পাওয়া যায়নি।');

      await this.db
        .update(studentProfiles)
        .set({
          verificationStatus: finalStatus,
          adminApprovedBy: currentUser.id,
          adminApprovedAt: new Date(),
          rejectionReason: approved ? null : reason,
        })
        .where(eq(studentProfiles.id, profileId));

      await this.db
        .update(users)
        .set({ status: approved ? 'active' : 'rejected' })
        .where(eq(users.id, record.user.id));

      // Notify the student user
      await this.notificationsService.createNotification({
        recipientUserId: record.user.id,
        titleBn: approved
          ? 'অভিনন্দন! শিক্ষার্থী ভেরিফিকেশন অনুমোদিত হয়েছে'
          : 'শিক্ষার্থী ভেরিফিকেশন আবেদন প্রত্যাখ্যাত',
        titleEn: approved ? 'Student Verification Approved' : 'Student Verification Rejected',
        messageBn: approved
          ? 'আপনার শিক্ষার্থী অ্যাকাউন্টটি সফলভাবে ভেরিফাইড হয়েছে। এখন আপনি সকল ফিচার ব্যবহার করতে পারবেন।'
          : `আপনার শিক্ষার্থী অ্যাকাউন্ট ভেরিফিকেশন আবেদন বাতিল করা হয়েছে। কারণ: ${reason || 'প্রদত্ত তথ্য অসঙ্গতিপূর্ণ'}`,
        messageEn: approved
          ? 'Your student account has been verified successfully. All features are now unlocked.'
          : `Your student verification request was rejected. Reason: ${reason || 'Inconsistent information'}`,
        type: 'student_verification_result',
        link: '/student',
      });

      if (approved && record.profile.organizationId) {
        await this.notificationsService.createNotification({
          recipientOrgId: record.profile.organizationId,
          titleBn: 'শিক্ষার্থী অনুমোদন সম্পন্ন!',
          titleEn: 'Student Affiliation Approved by Admin',
          messageBn: `আপনার প্রতিষ্ঠানের শিক্ষার্থী "${record.user.fullName}" এডমিন কর্তৃক চূড়ান্তভাবে অনুমোদিত হয়েছেন।`,
          messageEn: `Student "${record.user.fullName}" was granted final approval by administrator.`,
          type: 'student_affiliation_approved',
          link: '/organization?tab=affiliations',
        });
      }

      return {
        success: true,
        message: approved ? 'শিক্ষার্থী সফলভাবে অনুমোদিত ও অ্যাক্টিভ হয়েছে।' : 'শিক্ষার্থীর আবেদন বাতিল করা হয়েছে।',
      };
    }
  }

  async getMyStudentProfile(currentUser: any) {
    const [userRecord] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, currentUser.id), isNull(users.deletedAt)))
      .limit(1);

    if (!userRecord) {
      throw new NotFoundException('ব্যবহারকারী পাওয়া যায়নি।');
    }

    const [profile] = await this.db
      .select({
        id: studentProfiles.id,
        userId: studentProfiles.userId,
        organizationId: studentProfiles.organizationId,
        address: studentProfiles.address,
        institutionName: studentProfiles.institutionName,
        studentClassRoll: studentProfiles.studentClassRoll,
        fatherName: studentProfiles.fatherName,
        className: studentProfiles.className,
        department: studentProfiles.department,
        rollNumber: studentProfiles.rollNumber,
        dateOfBirth: studentProfiles.dateOfBirth,
        bloodGroup: studentProfiles.bloodGroup,
        presentAddress: studentProfiles.presentAddress,
        permanentAddress: studentProfiles.permanentAddress,
        guardianName: studentProfiles.guardianName,
        guardianRelationship: studentProfiles.guardianRelationship,
        guardianPhone: studentProfiles.guardianPhone,
        guardianAddress: studentProfiles.guardianAddress,
        nidOrBirthCertificateNumber: studentProfiles.nidOrBirthCertificateNumber,
        nidOrBirthCertificateUrl: studentProfiles.nidOrBirthCertificateUrl,
        photoUrl: studentProfiles.photoUrl,
        verificationStatus: studentProfiles.verificationStatus,
        rejectionReason: studentProfiles.rejectionReason,
        orgApprovedAt: studentProfiles.orgApprovedAt,
        adminApprovedAt: studentProfiles.adminApprovedAt,
        orgName: organizations.name,
      })
      .from(studentProfiles)
      .leftJoin(organizations, eq(studentProfiles.organizationId, organizations.id))
      .where(eq(studentProfiles.userId, currentUser.id))
      .limit(1);

    const isLocked =
      profile &&
      (profile.orgApprovedAt !== null ||
        profile.verificationStatus === 'verified' ||
        profile.verificationStatus === 'pending_admin');

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
        phone: userRecord.phone,
        address: userRecord.address,
        avatarUrl: userRecord.avatarUrl,
        role: userRecord.role,
        status: userRecord.status,
      },
      profile: profile || null,
      isLocked: !!isLocked,
    };
  }

  async updateMyStudentProfile(currentUser: any, data: any) {
    const userId = currentUser.id;

    // Check if student profile is already approved/verified by organization
    const [existingProfile] = await this.db
      .select({
        id: studentProfiles.id,
        verificationStatus: studentProfiles.verificationStatus,
        orgApprovedAt: studentProfiles.orgApprovedAt,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const isOrgVerified =
      existingProfile &&
      (existingProfile.orgApprovedAt !== null ||
        existingProfile.verificationStatus === 'verified' ||
        existingProfile.verificationStatus === 'pending_admin');

    // 1. Update users table
    const userUpdates: any = {};
    if (!isOrgVerified && data.fullName !== undefined && data.fullName.trim()) {
      userUpdates.fullName = data.fullName.trim();
    }
    if (data.phone !== undefined) {
      const cleanPhone = (data.phone || '').trim();
      if (cleanPhone) {
        const existing = await this.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.phone, cleanPhone),
              ne(users.id, userId),
              isNull(users.deletedAt)
            )
          )
          .limit(1);
        if (existing.length > 0) {
          throw new BadRequestException('এই ফোন নম্বরটি ইতোমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।');
        }
        userUpdates.phone = cleanPhone;
      } else {
        userUpdates.phone = null;
      }
    }
    if (data.presentAddress !== undefined || data.address !== undefined) {
      userUpdates.address = (data.presentAddress || data.address || '').trim() || null;
    }
    if (data.avatarUrl !== undefined) {
      userUpdates.avatarUrl = data.avatarUrl || null;
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.db.update(users).set(userUpdates).where(eq(users.id, userId));
    }

    // 2. Update student_profiles table
    const profileUpdates: any = {};
    if (!isOrgVerified) {
      if (data.fatherName !== undefined) profileUpdates.fatherName = (data.fatherName || '').trim() || null;
      if (data.dateOfBirth !== undefined) profileUpdates.dateOfBirth = (data.dateOfBirth || '').trim() || null;
      if (data.nidOrBirthCertificateNumber !== undefined) profileUpdates.nidOrBirthCertificateNumber = (data.nidOrBirthCertificateNumber || '').trim() || null;
      if (data.permanentAddress !== undefined) profileUpdates.permanentAddress = (data.permanentAddress || '').trim() || null;
    }
    if (data.className !== undefined) profileUpdates.className = (data.className || '').trim() || null;
    if (data.department !== undefined) profileUpdates.department = (data.department || '').trim() || null;
    if (data.rollNumber !== undefined) profileUpdates.rollNumber = (data.rollNumber || '').trim() || null;
    if (data.bloodGroup !== undefined) profileUpdates.bloodGroup = (data.bloodGroup || '').trim() || null;
    if (data.presentAddress !== undefined) profileUpdates.presentAddress = (data.presentAddress || '').trim() || null;
    if (data.guardianName !== undefined) profileUpdates.guardianName = (data.guardianName || '').trim() || null;
    if (data.guardianRelationship !== undefined) profileUpdates.guardianRelationship = (data.guardianRelationship || '').trim() || null;
    if (data.guardianPhone !== undefined) profileUpdates.guardianPhone = (data.guardianPhone || '').trim() || null;
    if (data.guardianAddress !== undefined) profileUpdates.guardianAddress = (data.guardianAddress || '').trim() || null;
    if (data.avatarUrl !== undefined) profileUpdates.photoUrl = data.avatarUrl || null;

    if (data.presentAddress || data.address) {
      profileUpdates.address = (data.presentAddress || data.address || '').trim();
    }
    if (data.rollNumber || data.className) {
      const combined = [data.className, data.rollNumber].filter(Boolean).join(' - ');
      if (combined) profileUpdates.studentClassRoll = combined;
    }

    const [existingFullProfile] = await this.db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (existingFullProfile) {
      if (Object.keys(profileUpdates).length > 0) {
        await this.db
          .update(studentProfiles)
          .set(profileUpdates)
          .where(eq(studentProfiles.id, existingFullProfile.id));
      }
    } else {
      await this.db.insert(studentProfiles).values({
        id: randomUUID(),
        userId,
        address: profileUpdates.presentAddress || userUpdates.address || 'বাংলাদেশ',
        institutionName: 'অপেক্ষমাণ',
        studentClassRoll: profileUpdates.studentClassRoll || profileUpdates.rollNumber || 'N/A',
        verificationStatus: 'pending_org',
        ...profileUpdates,
      });
    }

    return this.getMyStudentProfile(currentUser);
  }

  async getStudentDetails(currentUser: any, identifier: string) {
    let studentUser: any = null;
    let studentProfile: any = null;
    let orgData: any = null;

    const [byUser] = await this.db
      .select({
        profile: studentProfiles,
        user: users,
        org: organizations,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .leftJoin(organizations, eq(studentProfiles.organizationId, organizations.id))
      .where(and(eq(users.id, identifier), isNull(users.deletedAt)))
      .limit(1);

    if (byUser && byUser.user.role === UserRole.STUDENT) {
      studentUser = byUser.user;
      studentProfile = byUser.profile;
      orgData = byUser.org;
    } else {
      const [byProfile] = await this.db
        .select({
          profile: studentProfiles,
          user: users,
          org: organizations,
        })
        .from(studentProfiles)
        .innerJoin(users, eq(studentProfiles.userId, users.id))
        .leftJoin(organizations, eq(studentProfiles.organizationId, organizations.id))
        .where(eq(studentProfiles.id, identifier))
        .limit(1);

      if (byProfile) {
        studentUser = byProfile.user;
        studentProfile = byProfile.profile;
        orgData = byProfile.org;
      }
    }

    if (!studentUser) {
      throw new NotFoundException('শিক্ষার্থীর তথ্য পাওয়া যায়নি।');
    }

    // Role-based Access Control
    const isMaster = currentUser.role === UserRole.MASTER_ADMIN;
    const isSuperOrAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN;
    const isOrg = currentUser.role === UserRole.ORGANIZATION;
    const isTeacher = currentUser.role === UserRole.TEACHER;

    if (!isMaster && !isSuperOrAdmin && !isOrg && !isTeacher) {
      throw new ForbiddenException('এই শিক্ষার্থীর বিস্তারিত তথ্য দেখার অনুমতি আপনার নেই।');
    }

    if (isOrg) {
      if (studentProfile?.organizationId && studentProfile.organizationId !== currentUser.organizationId) {
        throw new ForbiddenException('এই শিক্ষার্থী আপনার প্রতিষ্ঠানের অন্তর্ভুক্ত নয়।');
      }
    }

    if (isTeacher) {
      const [tProfile] = await this.db
        .select()
        .from(teacherProfiles)
        .where(eq(teacherProfiles.userId, currentUser.id))
        .limit(1);

      if (!tProfile || !tProfile.organizationId || (studentProfile?.organizationId && studentProfile.organizationId !== tProfile.organizationId)) {
        throw new ForbiddenException('শুধুমাত্র নিজ প্রতিষ্ঠানের শিক্ষার্থীদের তথ্য দেখতে পারবেন।');
      }
    }

    // Fetch all campaigns/posts of this student
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
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .where(and(eq(studentPosts.studentId, studentUser.id), isNull(studentPosts.deletedAt)))
      .orderBy(desc(studentPosts.createdAt));

    return {
      user: {
        id: studentUser.id,
        email: studentUser.email,
        fullName: studentUser.fullName,
        phone: studentUser.phone,
        address: studentUser.address,
        avatarUrl: studentUser.avatarUrl,
        status: studentUser.status,
        createdAt: studentUser.createdAt,
      },
      profile: studentProfile ? {
        id: studentProfile.id,
        fatherName: studentProfile.fatherName,
        className: studentProfile.className,
        department: studentProfile.department,
        rollNumber: studentProfile.rollNumber,
        studentClassRoll: studentProfile.studentClassRoll,
        dateOfBirth: studentProfile.dateOfBirth,
        bloodGroup: studentProfile.bloodGroup,
        nidOrBirthCertificateNumber: studentProfile.nidOrBirthCertificateNumber,
        nidOrBirthCertificateUrl: studentProfile.nidOrBirthCertificateUrl,
        photoUrl: studentProfile.photoUrl || studentUser.avatarUrl,
        presentAddress: studentProfile.presentAddress || studentProfile.address || studentUser.address,
        permanentAddress: studentProfile.permanentAddress,
        guardianName: studentProfile.guardianName,
        guardianRelationship: studentProfile.guardianRelationship,
        guardianPhone: studentProfile.guardianPhone,
        guardianAddress: studentProfile.guardianAddress,
        institutionName: studentProfile.institutionName,
        verificationStatus: studentProfile.verificationStatus,
        orgApprovedAt: studentProfile.orgApprovedAt,
        adminApprovedAt: studentProfile.adminApprovedAt,
        rejectionReason: studentProfile.rejectionReason,
      } : null,
      organization: orgData ? {
        id: orgData.id,
        name: orgData.name,
        address: orgData.address,
      } : null,
      posts,
    };
  }

  async getDonorDetails(requester: any, donorId: string) {
    const donorUser = await this.db.query.users.findFirst({
      where: and(eq(users.id, donorId), isNull(users.deletedAt)),
    });

    if (!donorUser) {
      throw new NotFoundException('Donor not found');
    }

    const reviewerUser = alias(users, 'donor_reviewer_user');
    const itemReviewerUser = alias(users, 'item_reviewer_user');

    // Get all monetary donations by this donor with reviewer & target info
    const userDonations = await this.db
      .select({
        id: donations.id,
        amount: donations.amount,
        isRandom: donations.isRandom,
        isAnonymous: donations.isAnonymous,
        postId: donations.postId,
        postTitle: studentPosts.title,
        studentName: studentPosts.studentFullName,
        orgName: organizations.name,
        paymentMethod: donations.paymentMethod,
        trxId: donations.transactionReference,
        donorNote: donations.donorNote,
        status: donations.status,
        rejectionReason: donations.rejectionReason,
        createdAt: donations.createdAt,
        reviewedAt: donations.reviewedAt,
        reviewerName: reviewerUser.fullName,
        reviewerRole: reviewerUser.role,
        reviewerPhone: reviewerUser.phone,
      })
      .from(donations)
      .leftJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .leftJoin(organizations, eq(studentPosts.organizationId, organizations.id))
      .leftJoin(reviewerUser, eq(donations.reviewedBy, reviewerUser.id))
      .where(eq(donations.donorId, donorId))
      .orderBy(desc(donations.createdAt));

    // Get all item donations by this donor
    const userItemDonations = await this.db
      .select({
        id: itemDonations.id,
        itemName: itemDonations.itemName,
        description: itemDonations.description,
        quantity: itemDonations.quantity,
        isRandom: itemDonations.isRandom,
        isAnonymous: itemDonations.isAnonymous,
        postId: itemDonations.postId,
        postTitle: studentPosts.title,
        status: itemDonations.status,
        deliveryStatus: itemDonations.deliveryStatus,
        createdAt: itemDonations.createdAt,
        reviewedAt: itemDonations.reviewedAt,
        adminInstruction: itemDonations.adminInstruction,
        reviewerName: itemReviewerUser.fullName,
        reviewerRole: itemReviewerUser.role,
        reviewerPhone: itemReviewerUser.phone,
      })
      .from(itemDonations)
      .leftJoin(studentPosts, eq(itemDonations.postId, studentPosts.id))
      .leftJoin(itemReviewerUser, eq(itemDonations.reviewedBy, itemReviewerUser.id))
      .where(eq(itemDonations.donorId, donorId))
      .orderBy(desc(itemDonations.createdAt));

    const totalDonated = userDonations
      .filter((d) => d.status === 'accepted')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const totalCount = userDonations.length;
    const verifiedCount = userDonations.filter((d) => d.status === 'accepted').length;

    return {
      donor: {
        id: donorUser.id,
        email: donorUser.email,
        fullName: donorUser.fullName,
        phone: donorUser.phone,
        role: donorUser.role,
        address: donorUser.address,
        avatarUrl: donorUser.avatarUrl,
        status: donorUser.status,
        createdAt: donorUser.createdAt,
      },
      stats: {
        totalDonated,
        totalCount,
        verifiedCount,
        itemDonationsCount: userItemDonations.length,
      },
      donations: userDonations.map((d) => ({
        ...d,
        amount: Number(d.amount),
        targetName: d.isRandom
          ? 'সাদাকাহ বিডি সাধারণ শিক্ষা তহবিল'
          : `${d.studentName || 'শিক্ষার্থী'}${d.orgName ? ` (${d.orgName})` : ''}`,
        studentName: d.isRandom
          ? 'সাধারণ শিক্ষা তহবিল'
          : `${d.studentName || d.postTitle || 'সরাসরি শিক্ষার্থী'}${d.orgName ? ` • ${d.orgName}` : ''}`,
        reviewer: d.reviewerName
          ? {
              name: d.reviewerName,
              role: d.reviewerRole,
              phone: d.reviewerPhone,
            }
          : null,
        time: d.createdAt ? new Date(d.createdAt).toLocaleString('bn-BD') : '',
      })),
      itemDonations: userItemDonations.map((item) => ({
        ...item,
        reviewer: item.reviewerName
          ? {
              name: item.reviewerName,
              role: item.reviewerRole,
              phone: item.reviewerPhone,
            }
          : null,
        time: item.createdAt ? new Date(item.createdAt).toLocaleString('bn-BD') : '',
      })),
    };
  }

  async requestInstitutionTransfer(
    currentUser: any,
    dto: { targetOrgId: string; reason: string }
  ) {
    if (currentUser.role !== UserRole.STUDENT && currentUser.role !== UserRole.TEACHER) {
      throw new BadRequestException('শুধুমাত্র শিক্ষার্থী এবং শিক্ষক প্রতিষ্ঠান পরিবর্তনের আবেদন করতে পারবেন।');
    }

    if (!currentUser.organizationId) {
      throw new BadRequestException('আপনি বর্তমানে কোনো অনুমোদিত প্রতিষ্ঠানের সাথে যুক্ত নন।');
    }

    if (!dto.targetOrgId) {
      throw new BadRequestException('অনুগ্রহ করে কাঙ্ক্ষিত নতুন প্রতিষ্ঠানটি নির্বাচন করুন।');
    }

    if (dto.targetOrgId === currentUser.organizationId) {
      throw new BadRequestException('আপনার বর্তমান প্রতিষ্ঠান এবং নতুন প্রতিষ্ঠান একই হতে পারবে না।');
    }

    const cleanReason = dto.reason?.trim();
    if (!cleanReason || cleanReason.length < 5) {
      throw new BadRequestException('অনুগ্রহ করে প্রতিষ্ঠান পরিবর্তনের সুস্পষ্ট কারণ লিখুন (কমপক্ষে ৫ অক্ষর)।');
    }

    // Verify target organization exists and is active
    const [targetOrg] = await this.db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, dto.targetOrgId), isNull(organizations.deletedAt)))
      .limit(1);

    if (!targetOrg) {
      throw new NotFoundException('নির্বাচিত নতুন প্রতিষ্ঠানটি পাওয়া যায়নি।');
    }

    if (targetOrg.status !== 'active') {
      throw new BadRequestException('নির্বাচিত প্রতিষ্ঠানটি এখনও সক্রিয় বা অনুমোদিত নয়।');
    }

    // Check if user already has an active pending transfer
    const [existingTransfer] = await this.db
      .select()
      .from(institutionTransfers)
      .where(
        and(
          eq(institutionTransfers.userId, currentUser.id),
          inArray(institutionTransfers.status, [
            'pending_current_org',
            'current_org_approved',
            'target_org_approved',
          ])
        )
      )
      .limit(1);

    if (existingTransfer) {
      throw new BadRequestException(
        'আপনার একটি প্রতিষ্ঠান পরিবর্তনের আবেদন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে পূর্বের আবেদনটি সম্পন্ন হওয়া পর্যন্ত অপেক্ষা করুন।'
      );
    }

    // Current org details
    const [currentOrg] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, currentUser.organizationId))
      .limit(1);

    const transferId = randomUUID();
    await this.db.insert(institutionTransfers).values({
      id: transferId,
      userId: currentUser.id,
      userRole: currentUser.role,
      currentOrgId: currentUser.organizationId,
      targetOrgId: dto.targetOrgId,
      reason: cleanReason,
      status: 'pending_current_org',
    });

    const roleNameBn = currentUser.role === UserRole.TEACHER ? 'শিক্ষক' : 'শিক্ষার্থী';
    const roleNameEn = currentUser.role === UserRole.TEACHER ? 'Teacher' : 'Student';

    // 1. Notify Current Organization (Needs release approval)
    await this.notificationsService.createNotification({
      recipientOrgId: currentUser.organizationId,
      recipientRole: 'organization',
      titleBn: 'প্রতিষ্ঠান পরিবর্তন ও ছাড়পত্রের আবেদন',
      titleEn: 'Institution Transfer & Release Request',
      messageBn: `${roleNameBn} "${currentUser.fullName}" অন্য প্রতিষ্ঠানে (${targetOrg.name}) স্থানান্তরিত হওয়ার জন্য ছাড়পত্রের আবেদন করেছেন।`,
      messageEn: `${roleNameEn} "${currentUser.fullName}" requested release clearance to transfer to "${targetOrg.name}".`,
      type: 'transfer_request',
      link: '/organization?tab=transfers',
    });

    // 2. Notify Super Admins and Master Admin (Filtered by Permission)
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission:
        currentUser.role === UserRole.TEACHER
          ? PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS
          : PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS,
      titleBn: 'প্রতিষ্ঠান পরিবর্তনের আবেদন জমা হয়েছে',
      titleEn: 'New Institution Transfer Request',
      messageBn: `${roleNameBn} "${currentUser.fullName}" ("${currentOrg?.name || 'বর্তমান প্রতিষ্ঠান'}" থেকে "${targetOrg.name}") প্রতিষ্ঠান পরিবর্তনের আবেদন করেছেন। (বর্তমানে পূর্বের প্রতিষ্ঠান ছাড়পত্রের অপেক্ষায়)`,
      messageEn: `${roleNameEn} "${currentUser.fullName}" applied for institution transfer from "${currentOrg?.name || 'Current'}" to "${targetOrg.name}". (Awaiting current org release).`,
      type: 'transfer_request',
      link: '/admin?tab=transfer_requests',
    });

    // 3. Notify User
    await this.notificationsService.createNotification({
      recipientUserId: currentUser.id,
      titleBn: 'প্রতিষ্ঠান পরিবর্তনের আবেদন সফলভাবে জমা হয়েছে',
      titleEn: 'Transfer Request Submitted Successfully',
      messageBn: `আপনার প্রতিষ্ঠান পরিবর্তনের আবেদন সফলভাবে জমা হয়েছে। বর্তমান প্রতিষ্ঠান "${currentOrg?.name || ''}" কর্তৃক ছাড়পত্র প্রদানের অপেক্ষায় রয়েছে।`,
      messageEn: `Your transfer request has been submitted. Waiting for release approval from your current institution.`,
      type: 'transfer_request',
      link: currentUser.role === UserRole.TEACHER ? '/teacher' : '/student',
    });

    return {
      success: true,
      message: 'প্রতিষ্ঠান পরিবর্তনের আবেদন সফলভাবে জমা হয়েছে। বর্তমান প্রতিষ্ঠানের ছাড়পত্রের অপেক্ষায় রয়েছে।',
      transferId,
    };
  }

  async cancelInstitutionTransfer(currentUser: any) {
    const [transfer] = await this.db
      .select()
      .from(institutionTransfers)
      .where(
        and(
          eq(institutionTransfers.userId, currentUser.id),
          eq(institutionTransfers.status, 'pending_current_org')
        )
      )
      .limit(1);

    if (!transfer) {
      throw new BadRequestException('প্রত্যাহার করার মতো কোনো অপেক্ষমাণ ছাড়পত্র আবেদন পাওয়া যায়নি।');
    }

    await this.db
      .update(institutionTransfers)
      .set({
        status: 'rejected',
        rejectionStage: 'current_org',
        currentOrgRejectionReason: 'শিক্ষক/শিক্ষার্থী নিজেই আবেদন প্রত্যাহার করেছেন।',
        updatedAt: new Date(),
      })
      .where(eq(institutionTransfers.id, transfer.id));

    return {
      success: true,
      message: 'প্রতিষ্ঠান পরিবর্তনের আবেদনটি প্রত্যাহার করা হয়েছে।',
    };
  }

  async getMyInstitutionTransfer(currentUser: any) {
    const [latest] = await this.db
      .select({
        id: institutionTransfers.id,
        userId: institutionTransfers.userId,
        userRole: institutionTransfers.userRole,
        currentOrgId: institutionTransfers.currentOrgId,
        targetOrgId: institutionTransfers.targetOrgId,
        reason: institutionTransfers.reason,
        status: institutionTransfers.status,
        currentOrgApprovedBy: institutionTransfers.currentOrgApprovedBy,
        currentOrgApprovedAt: institutionTransfers.currentOrgApprovedAt,
        currentOrgRejectionReason: institutionTransfers.currentOrgRejectionReason,
        targetOrgApprovedBy: institutionTransfers.targetOrgApprovedBy,
        targetOrgApprovedAt: institutionTransfers.targetOrgApprovedAt,
        targetOrgRejectionReason: institutionTransfers.targetOrgRejectionReason,
        finalApprovedBy: institutionTransfers.finalApprovedBy,
        finalApprovedAt: institutionTransfers.finalApprovedAt,
        finalRejectionReason: institutionTransfers.finalRejectionReason,
        rejectionStage: institutionTransfers.rejectionStage,
        createdAt: institutionTransfers.createdAt,
        updatedAt: institutionTransfers.updatedAt,
      })
      .from(institutionTransfers)
      .where(eq(institutionTransfers.userId, currentUser.id))
      .orderBy(desc(institutionTransfers.createdAt))
      .limit(1);

    if (!latest) return { hasTransfer: false, transfer: null };

    const [currentOrg] = await this.db
      .select({ id: organizations.id, name: organizations.name, address: organizations.address })
      .from(organizations)
      .where(eq(organizations.id, latest.currentOrgId))
      .limit(1);

    const [targetOrg] = await this.db
      .select({ id: organizations.id, name: organizations.name, address: organizations.address })
      .from(organizations)
      .where(eq(organizations.id, latest.targetOrgId))
      .limit(1);

    const isPending = [
      'pending_current_org',
      'current_org_approved',
      'target_org_approved',
    ].includes(latest.status);

    return {
      hasTransfer: true,
      isPending,
      transfer: {
        ...latest,
        currentOrgName: currentOrg?.name || 'পূর্বের প্রতিষ্ঠান',
        currentOrgAddress: currentOrg?.address || '',
        targetOrgName: targetOrg?.name || 'নতুন প্রতিষ্ঠান',
        targetOrgAddress: targetOrg?.address || '',
      },
    };
  }

  async listAdminTransferRequests() {
    const records = await this.db
      .select({
        id: institutionTransfers.id,
        userId: institutionTransfers.userId,
        userRole: institutionTransfers.userRole,
        currentOrgId: institutionTransfers.currentOrgId,
        targetOrgId: institutionTransfers.targetOrgId,
        reason: institutionTransfers.reason,
        status: institutionTransfers.status,
        currentOrgApprovedAt: institutionTransfers.currentOrgApprovedAt,
        currentOrgRejectionReason: institutionTransfers.currentOrgRejectionReason,
        targetOrgApprovedAt: institutionTransfers.targetOrgApprovedAt,
        targetOrgRejectionReason: institutionTransfers.targetOrgRejectionReason,
        finalApprovedAt: institutionTransfers.finalApprovedAt,
        finalRejectionReason: institutionTransfers.finalRejectionReason,
        rejectionStage: institutionTransfers.rejectionStage,
        createdAt: institutionTransfers.createdAt,
        userName: users.fullName,
        userEmail: users.email,
        userPhone: users.phone,
        userAvatar: users.avatarUrl,
      })
      .from(institutionTransfers)
      .innerJoin(users, eq(institutionTransfers.userId, users.id))
      .orderBy(desc(institutionTransfers.createdAt));

    const allOrgIds = Array.from(
      new Set(records.flatMap((r) => [r.currentOrgId, r.targetOrgId]))
    );
    const orgsList = allOrgIds.length
      ? await this.db
          .select({ id: organizations.id, name: organizations.name, address: organizations.address })
          .from(organizations)
          .where(inArray(organizations.id, allOrgIds))
      : [];
    const orgMap = new Map(orgsList.map((o) => [o.id, o]));

    const mapped = records.map((r) => ({
      ...r,
      currentOrgName: orgMap.get(r.currentOrgId)?.name || 'অজানা প্রতিষ্ঠান',
      targetOrgName: orgMap.get(r.targetOrgId)?.name || 'অজানা প্রতিষ্ঠান',
    }));

    return {
      actionable: mapped.filter((r) => r.status === 'target_org_approved'),
      monitoring: mapped.filter((r) =>
        ['pending_current_org', 'current_org_approved'].includes(r.status)
      ),
      history: mapped.filter((r) => ['approved', 'rejected'].includes(r.status)),
    };
  }

  async reviewAdminTransfer(
    currentUser: any,
    transferId: string,
    approved: boolean,
    reason?: string
  ) {
    const [transfer] = await this.db
      .select()
      .from(institutionTransfers)
      .where(eq(institutionTransfers.id, transferId))
      .limit(1);

    if (!transfer) {
      throw new NotFoundException('প্রতিষ্ঠান পরিবর্তনের আবেদনটি পাওয়া যায়নি।');
    }

    if (transfer.status !== 'target_org_approved') {
      throw new BadRequestException(
        'উভয় প্রতিষ্ঠান (বর্তমান ও নতুন) অনুমোদন করার পরেই কেবল এডমিন চূড়ান্ত অনুমোদন দিতে পারেন।'
      );
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, transfer.userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('ব্যবহারকারী পাওয়া যায়নি।');
    }

    const [targetOrg] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, transfer.targetOrgId))
      .limit(1);

    const [currentOrg] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, transfer.currentOrgId))
      .limit(1);

    if (approved) {
      await this.db.transaction(async (tx) => {
        // 1. Mark transfer approved
        await tx
          .update(institutionTransfers)
          .set({
            status: 'approved',
            finalApprovedBy: currentUser.id,
            finalApprovedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(institutionTransfers.id, transferId));

        // 2. Update user organization
        await tx
          .update(users)
          .set({
            organizationId: transfer.targetOrgId,
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(users.id, transfer.userId));

        // 3. Update profile
        if (transfer.userRole === 'student') {
          await tx
            .update(studentProfiles)
            .set({
              organizationId: transfer.targetOrgId,
              institutionName: targetOrg?.name || 'নতুন প্রতিষ্ঠান',
              updatedAt: new Date(),
            })
            .where(eq(studentProfiles.userId, transfer.userId));
        } else if (transfer.userRole === 'teacher') {
          await tx
            .update(teacherProfiles)
            .set({
              organizationId: transfer.targetOrgId,
              updatedAt: new Date(),
            })
            .where(eq(teacherProfiles.userId, transfer.userId));
        }
      });

      const roleNameBn = transfer.userRole === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী';
      const roleNameEn = transfer.userRole === 'teacher' ? 'Teacher' : 'Student';

      // Notify User
      await this.notificationsService.createNotification({
        recipientUserId: transfer.userId,
        titleBn: 'অভিনন্দন! প্রতিষ্ঠান পরিবর্তন চূড়ান্তভাবে অনুমোদিত হয়েছে',
        titleEn: 'Institution Transfer Approved by Admin',
        messageBn: `সাদাকাহ বিডি এডমিন কর্তৃক আপনার প্রতিষ্ঠান পরিবর্তন চূড়ান্তভাবে অনুমোদিত হয়েছে। আপনার বর্তমান শিক্ষা প্রতিষ্ঠান এখন "${targetOrg?.name}"।`,
        messageEn: `Your transfer to "${targetOrg?.name}" has received final approval from the Administrator.`,
        type: 'transfer_completed',
        link: transfer.userRole === 'teacher' ? '/teacher' : '/student',
      });

      // Notify Current Org
      await this.notificationsService.createNotification({
        recipientOrgId: transfer.currentOrgId,
        titleBn: `${roleNameBn} স্থানান্তর সম্পন্ন হয়েছে`,
        titleEn: `${roleNameEn} Transfer Completed`,
        messageBn: `আপনার প্রতিষ্ঠানের ${roleNameBn} "${user.fullName}" এডমিনের চূড়ান্ত অনুমোদনের মাধ্যমে "${targetOrg?.name}" প্রতিষ্ঠানে স্থানান্তরিত হয়েছেন।`,
        messageEn: `${roleNameEn} "${user.fullName}" has been transferred to "${targetOrg?.name}".`,
        type: 'transfer_completed',
      });

      // Notify Target Org
      await this.notificationsService.createNotification({
        recipientOrgId: transfer.targetOrgId,
        titleBn: `নতুন ${roleNameBn} আপনার প্রতিষ্ঠানে স্থানান্তরিত হয়েছেন`,
        titleEn: `New ${roleNameEn} Officially Joined`,
        messageBn: `${roleNameBn} "${user.fullName}" এডমিনের চূড়ান্ত অনুমোদনের মাধ্যমে আপনার প্রতিষ্ঠানে অন্তর্ভুক্ত হয়েছেন।`,
        messageEn: `${roleNameEn} "${user.fullName}" has officially joined your institution.`,
        type: 'transfer_completed',
        link: `/organization?tab=${transfer.userRole === 'teacher' ? 'teachers' : 'affiliations'}`,
      });

      return {
        success: true,
        message: 'প্রতিষ্ঠান পরিবর্তন চূড়ান্তভাবে অনুমোদিত ও সফল হয়েছে।',
      };
    } else {
      await this.db
        .update(institutionTransfers)
        .set({
          status: 'rejected',
          finalRejectionReason: reason?.trim() || 'এডমিন কর্তৃক আবেদন বাতিল করা হয়েছে।',
          rejectionStage: 'admin',
          updatedAt: new Date(),
        })
        .where(eq(institutionTransfers.id, transferId));

      await this.notificationsService.createNotification({
        recipientUserId: transfer.userId,
        titleBn: 'প্রতিষ্ঠান পরিবর্তনের আবেদন প্রত্যাখ্যাত হয়েছে',
        titleEn: 'Institution Transfer Rejected by Admin',
        messageBn: `এডমিন কর্তৃক প্রতিষ্ঠান পরিবর্তনের আবেদনটি বাতিল করা হয়েছে। কারণ: ${reason?.trim() || 'প্রদত্ত তথ্য অপর্যাপ্ত'}`,
        messageEn: `Your institution transfer request was rejected by admin. Reason: ${reason?.trim() || 'Insufficient information'}`,
        type: 'transfer_rejected',
        link: transfer.userRole === 'teacher' ? '/teacher' : '/student',
      });

      return {
        success: true,
        message: 'স্থানান্তরের আবেদন বাতিল করা হয়েছে।',
      };
    }
  }

  async listUnassignedOrgUsers() {
    return this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.ORGANIZATION),
          or(isNull(users.organizationId), eq(users.organizationId, '')),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async getMyInstitutionHistory(currentUser: any) {
    const [userRecord] = await this.db
      .select({
        id: users.id,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    let currentOrg: any = null;
    if (userRecord?.organizationId) {
      const [found] = await this.db
        .select({
          id: organizations.id,
          name: organizations.name,
          address: organizations.address,
          type: organizations.type,
          phone: organizations.contactPhone,
          email: organizations.email,
        })
        .from(organizations)
        .where(eq(organizations.id, userRecord.organizationId))
        .limit(1);
      currentOrg = found;
    }

    // 1. Approved institution transfers where user was transferred
    const approvedTransfers = await this.db
      .select({
        id: institutionTransfers.id,
        orgId: institutionTransfers.currentOrgId,
        orgName: organizations.name,
        orgAddress: organizations.address,
        date: institutionTransfers.finalApprovedAt,
        reason: institutionTransfers.reason,
        type: sql<string>`'transfer'`,
      })
      .from(institutionTransfers)
      .innerJoin(organizations, eq(institutionTransfers.currentOrgId, organizations.id))
      .where(
        and(
          eq(institutionTransfers.userId, currentUser.id),
          eq(institutionTransfers.status, 'approved')
        )
      )
      .orderBy(desc(institutionTransfers.finalApprovedAt));

    // 2. Approved member removals where user was removed from an org
    const approvedRemovals = await this.db
      .select({
        id: orgMemberRemovals.id,
        orgId: orgMemberRemovals.organizationId,
        orgName: organizations.name,
        orgAddress: organizations.address,
        date: orgMemberRemovals.adminReviewedAt,
        reason: orgMemberRemovals.reason,
        type: sql<string>`'removal'`,
      })
      .from(orgMemberRemovals)
      .innerJoin(organizations, eq(orgMemberRemovals.organizationId, organizations.id))
      .where(
        and(
          eq(orgMemberRemovals.userId, currentUser.id),
          eq(orgMemberRemovals.status, 'approved')
        )
      )
      .orderBy(desc(orgMemberRemovals.adminReviewedAt));

    const combinedHistory = [...approvedTransfers, ...approvedRemovals].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    return {
      hasCurrentOrg: !!currentOrg,
      currentOrg,
      hasHistory: combinedHistory.length > 0,
      previousInstitutions: combinedHistory,
    };
  }

  async getAdminUserDetails(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        status: users.status,
        address: users.address,
        avatarUrl: users.avatarUrl,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new NotFoundException('ব্যবহারকারী পাওয়া যায়নি।');
    }

    let currentOrg: any = null;
    if (user.organizationId) {
      const [org] = await this.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);
      currentOrg = org;
    }

    // Previous institutions history
    const history = await this.getMyInstitutionHistory({ id: user.id });

    // Profile details (student or teacher)
    let studentProfile: any = null;
    let teacherProfile: any = null;
    if (user.role === UserRole.STUDENT) {
      const [sp] = await this.db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, user.id))
        .limit(1);
      studentProfile = sp;
    } else if (user.role === UserRole.TEACHER) {
      const [tp] = await this.db
        .select()
        .from(teacherProfiles)
        .where(eq(teacherProfiles.userId, user.id))
        .limit(1);
      teacherProfile = tp;
    }

    // Posts (if student)
    const userPosts = await this.db
      .select({
        id: studentPosts.id,
        title: studentPosts.title,
        problemDescription: studentPosts.problemDescription,
        totalRequiredAmount: studentPosts.totalRequiredAmount,
        receivedAmount: studentPosts.receivedAmount,
        verificationStatus: studentPosts.verificationStatus,
        createdAt: studentPosts.createdAt,
      })
      .from(studentPosts)
      .where(and(eq(studentPosts.studentId, user.id), isNull(studentPosts.deletedAt)))
      .orderBy(desc(studentPosts.createdAt));

    // Teacher attestations (posts verified by this teacher)
    const teacherAttestations = user.role === UserRole.TEACHER
      ? await this.db
          .select({
            id: studentPosts.id,
            title: studentPosts.title,
            studentName: users.fullName,
            verificationStatus: studentPosts.verificationStatus,
            createdAt: studentPosts.createdAt,
          })
          .from(studentPosts)
          .innerJoin(users, eq(studentPosts.studentId, users.id))
          .where(and(eq(studentPosts.teacherVerifiedBy, user.id), isNull(studentPosts.deletedAt)))
          .orderBy(desc(studentPosts.createdAt))
      : [];

    // Complaints submitted by user
    const userComplaints = await this.db
      .select()
      .from(complaints)
      .where(eq(complaints.senderId, user.id))
      .orderBy(desc(complaints.createdAt));

    // Donations made by this user
    const userDonations = await this.db
      .select({
        id: donations.id,
        amount: donations.amount,
        paymentMethod: donations.paymentMethod,
        transactionReference: donations.transactionReference,
        status: donations.status,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(eq(donations.donorId, user.id))
      .orderBy(desc(donations.createdAt));

    const deletionEligibility = await this.checkUserPlatformData(user.id);

    return {
      user,
      currentOrg,
      previousInstitutions: history.previousInstitutions,
      studentProfile,
      teacherProfile,
      posts: userPosts,
      attestations: teacherAttestations,
      complaints: userComplaints,
      donations: userDonations,
      deletionEligibility,
    };
  }
}
