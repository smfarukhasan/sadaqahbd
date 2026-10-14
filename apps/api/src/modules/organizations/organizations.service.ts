import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DrizzleDB } from '../../database';
import { DRIZZLE_DB } from '../../database/database.module';
import { organizations, users, studentProfiles, teacherProfiles, institutionTransfers, donations, studentPosts, orgMemberRemovals } from '../../database/schema';
import { eq, and, isNull, desc, sql, or, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionModuleKey } from '@sadaqahbd/schema';

export interface ApplyOrgDto {
  name: string;
  address: string;
  phone: string;
  email?: string;
  type?: string;
  description?: string;
  registrationNumber?: string;
}

export interface RequestNewOrgDto {
  name: string;
  address: string;
  phone: string;
  email?: string;
  type?: string;
  notes?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly database: DrizzleDB,
    private readonly notificationsService: NotificationsService
  ) {}

  async applyOrganization(currentUser: any, dto: ApplyOrgDto) {
    if (!dto.name?.trim() || !dto.address?.trim() || !dto.phone?.trim()) {
      throw new BadRequestException('প্রতিষ্ঠানের নাম, ঠিকানা ও যোগাযোগের ফোন নম্বর আবশ্যক।');
    }
    if (!dto.type?.trim()) {
      throw new BadRequestException('প্রতিষ্ঠানের ধরন নির্বাচন বাধ্যতামূলক।');
    }

    let orgId = currentUser.organizationId;
    let existingOrg: any = null;

    if (orgId) {
      const [found] = await this.database
        .select()
        .from(organizations)
        .where(and(eq(organizations.id, orgId), isNull(organizations.deletedAt)))
        .limit(1);
      existingOrg = found;
    }

    if (existingOrg) {
      await this.database
        .update(organizations)
        .set({
          name: dto.name.trim(),
          address: dto.address.trim(),
          contactPhone: dto.phone.trim(),
          contactPerson: currentUser.fullName || 'অর্গানাইজেশন এডমিন',
          email: dto.email?.trim() || null,
          type: dto.type.trim(),
          registrationNumber: dto.registrationNumber?.trim() || null,
          description: dto.description?.trim() || null,
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId));
    } else {
      orgId = randomUUID();
      await this.database.insert(organizations).values({
        id: orgId,
        name: dto.name.trim(),
        address: dto.address.trim(),
        contactPhone: dto.phone.trim(),
        contactPerson: currentUser.fullName || 'অর্গানাইজেশন এডমিন',
        email: dto.email?.trim() || null,
        type: dto.type.trim(),
        registrationNumber: dto.registrationNumber?.trim() || null,
        description: dto.description?.trim() || null,
        status: 'pending',
        isRequestedByMember: false,
        requestedByUserId: currentUser.id,
      });

      // Link organizationId to user
      await this.database
        .update(users)
        .set({ organizationId: orgId, status: 'pending' })
        .where(eq(users.id, currentUser.id));
    }

    // Dispatch Notification to Super Admin and Master Admin (Filtered by Permission)
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission: PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
      titleBn: 'নতুন শিক্ষা প্রতিষ্ঠান অনুমোদন আবেদন',
      titleEn: 'New Organization Verification Request',
      messageBn: `"${dto.name}" প্রতিষ্ঠানটি অ্যাকাউন্ট ভেরিফিকেশনের জন্য আবেদন জমা দিয়েছে। বিস্তারিত পর্যালোচনা করুন।`,
      messageEn: `"${dto.name}" has submitted an organization verification application.`,
      type: 'org_verification',
      link: '/admin?tab=org_requests',
    });

    return {
      success: true,
      message: 'প্রতিষ্ঠানের আবেদন সফলভাবে জমা হয়েছে। এডমিন অনুমোদনের অপেক্ষায় রয়েছে।',
      organizationId: orgId,
      status: 'pending',
    };
  }

  async getMyStatus(currentUser: any) {
    let org: any = null;
    if (currentUser.organizationId) {
      const [found] = await this.database
        .select()
        .from(organizations)
        .where(and(eq(organizations.id, currentUser.organizationId), isNull(organizations.deletedAt)))
        .limit(1);
      org = found;
    } else {
      // Check if user has an org where requestedByUserId = user.id
      const [found] = await this.database
        .select()
        .from(organizations)
        .where(and(eq(organizations.requestedByUserId, currentUser.id), isNull(organizations.deletedAt)))
        .limit(1);
      org = found;
    }

    if (!org) {
      return {
        hasApplied: false,
        status: 'unapplied',
        organization: null,
      };
    }

    return {
      hasApplied: true,
      status: org.status,
      organization: {
        id: org.id,
        name: org.name,
        registrationNumber: org.registrationNumber,
        address: org.address,
        phone: org.contactPhone,
        email: org.email,
        type: org.type,
        description: org.description,
        status: org.status,
        createdAt: org.createdAt,
      },
    };
  }

  async getActiveOrganizations() {
    return await this.database
      .select({
        id: organizations.id,
        name: organizations.name,
        address: organizations.address,
        phone: organizations.contactPhone,
        type: organizations.type,
      })
      .from(organizations)
      .where(and(eq(organizations.status, 'active'), isNull(organizations.deletedAt)))
      .orderBy(organizations.name);
  }

  async requestNewOrganization(currentUser: any, dto: RequestNewOrgDto) {
    if (!dto.name?.trim() || !dto.address?.trim() || !dto.phone?.trim()) {
      throw new BadRequestException('প্রতিষ্ঠানের নাম, ঠিকানা এবং যোগাযোগের ফোন নম্বর আবশ্যক।');
    }

    const orgId = randomUUID();
    await this.database.insert(organizations).values({
      id: orgId,
      name: dto.name.trim(),
      address: dto.address.trim(),
      contactPhone: dto.phone.trim(),
      email: dto.email?.trim() || null,
      contactPerson: 'Member Suggested',
      type: dto.type?.trim() || 'qawmi_madrasa',
      description: dto.notes?.trim() || 'শিক্ষার্থী/শিক্ষক কর্তৃক প্রস্তাবিত প্রতিষ্ঠান',
      status: 'pending',
      isRequestedByMember: true,
      requestedByUserId: currentUser.id,
    });

    // Notify Super Admin for Physical Verification (Filtered by Permission)
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission: PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
      titleBn: 'নতুন প্রতিষ্ঠানের তথ্য জমা (সরেজমিনে ভেরিফিকেশন)',
      titleEn: 'New Organization Suggested (Physical Verification Required)',
      messageBn: `${currentUser.fullName} ("${dto.name}") নতুন প্রতিষ্ঠানের তথ্য জমা দিয়েছেন। দয়া করে সরেজমিনে যাচাই করে অ্যাকাউন্ট খোলার ব্যবস্থা নিন।`,
      messageEn: `${currentUser.fullName} suggested new organization "${dto.name}" for physical verification.`,
      type: 'member_org_suggestion',
      link: '/admin?tab=org_requests',
    });

    return {
      success: true,
      message: 'নতুন প্রতিষ্ঠানের তথ্য সফলভাবে জমা দেওয়া হয়েছে। সুপার এডমিন সরেজমিনে ভেরিফাই করে এটি যুক্ত করবেন।',
      organizationId: orgId,
    };
  }

  async resolveOrgId(currentUser: any): Promise<string | null> {
    if (currentUser.organizationId) return currentUser.organizationId;
    const [found] = await this.database
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        or(
          eq(organizations.requestedByUserId, currentUser.id),
          eq(organizations.id, currentUser.id)
        )
      )
      .limit(1);
    return found ? found.id : null;
  }

  async getPendingAffiliations(currentUser: any) {
    const orgId = await this.resolveOrgId(currentUser);
    if (!orgId) {
      return { teachers: [], students: [], historyTeachers: [], historyStudents: [] };
    }

    // Pending Teachers
    const pendingTeachers = await this.database
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
        createdAt: teacherProfiles.createdAt,
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .where(
        and(
          eq(teacherProfiles.organizationId, orgId),
          eq(teacherProfiles.verificationStatus, 'pending_org'),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(teacherProfiles.createdAt));

    // Pending Students
    const pendingStudents = await this.database
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
        createdAt: studentProfiles.createdAt,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(
        and(
          eq(studentProfiles.organizationId, orgId),
          eq(studentProfiles.verificationStatus, 'pending_org'),
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(studentProfiles.createdAt));

    // History Teachers (Past processed)
    const historyTeachers = await this.database
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
        rejectionReason: teacherProfiles.rejectionReason,
        orgApprovedAt: teacherProfiles.orgApprovedAt,
        adminApprovedAt: teacherProfiles.adminApprovedAt,
        createdAt: teacherProfiles.createdAt,
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .where(
        and(
          eq(teacherProfiles.organizationId, orgId),
          sql`${teacherProfiles.verificationStatus} != 'pending_org'`,
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(teacherProfiles.updatedAt));

    // History Students (Past processed)
    const historyStudents = await this.database
      .select({
        profileId: studentProfiles.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        className: studentProfiles.className,
        rollNumber: studentProfiles.rollNumber,
        studentClassRoll: studentProfiles.studentClassRoll,
        address: studentProfiles.address,
        institutionName: studentProfiles.institutionName,
        verificationStatus: studentProfiles.verificationStatus,
        rejectionReason: studentProfiles.rejectionReason,
        orgApprovedAt: studentProfiles.orgApprovedAt,
        adminApprovedAt: studentProfiles.adminApprovedAt,
        createdAt: studentProfiles.createdAt,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(
        and(
          eq(studentProfiles.organizationId, orgId),
          sql`${studentProfiles.verificationStatus} != 'pending_org'`,
          isNull(users.deletedAt)
        )
      )
      .orderBy(desc(studentProfiles.updatedAt));

    return {
      teachers: pendingTeachers,
      students: pendingStudents,
      historyTeachers,
      historyStudents,
    };
  }

  async reviewAffiliationByOrg(
    currentUser: any,
    role: 'teacher' | 'student',
    profileId: string,
    approved: boolean,
    reason?: string
  ) {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি কোনো অনুমোদিত প্রতিষ্ঠানের সাথে যুক্ত নয়।');
    }

    const nextStatus = approved ? 'pending_admin' : 'rejected';

    if (role === 'teacher') {
      const [teacher] = await this.database
        .select({ profile: teacherProfiles, user: users })
        .from(teacherProfiles)
        .innerJoin(users, eq(teacherProfiles.userId, users.id))
        .where(and(eq(teacherProfiles.id, profileId), eq(teacherProfiles.organizationId, orgId)))
        .limit(1);

      if (!teacher) throw new NotFoundException('শিক্ষক প্রোফাইল পাওয়া যায়নি।');

      await this.database
        .update(teacherProfiles)
        .set({
          verificationStatus: nextStatus,
          orgApprovedBy: currentUser.id,
          orgApprovedAt: new Date(),
          rejectionReason: approved ? null : reason,
        })
        .where(eq(teacherProfiles.id, profileId));

      if (approved) {
        // 1. Notify Admins to give final approval
        await this.notificationsService.createNotification({
          recipientRole: 'admin',
          titleBn: 'প্রতিষ্ঠান কর্তৃক শিক্ষক অনুমোদিত (চূড়ান্ত এডমিন ছাড়পত্র প্রয়োজন)',
          titleEn: 'Teacher Approved by Org (Final Admin Clearance Needed)',
          messageBn: `প্রতিষ্ঠান কর্তৃক শিক্ষক "${teacher.user.fullName}" অনুমোদিত হয়েছে। দয়া করে চূড়ান্ত অনুমোদন প্রদান করুন।`,
          messageEn: `Teacher "${teacher.user.fullName}" was approved by institution. Pending final admin verification.`,
          type: 'teacher_affiliation',
          link: '/admin?tab=affiliation_requests',
        });

        // 2. Notify the Teacher user
        await this.notificationsService.createNotification({
          recipientUserId: teacher.user.id,
          titleBn: 'প্রতিষ্ঠান আবেদন অনুমোদন করেছে!',
          titleEn: 'Institution Approved Affiliation!',
          messageBn: 'আপনার শিক্ষা প্রতিষ্ঠান আবেদনটি অনুমোদন করেছে। এখন সুপার এডমিনের চূড়ান্ত ছাড়পত্রের অপেক্ষায় রয়েছে।',
          messageEn: 'Your institution approved your affiliation. Final verification by admin is in progress.',
          type: 'teacher_affiliation',
          link: '/teacher',
        });
      }

      return {
        success: true,
        message: approved
          ? 'শিক্ষককে সফলভাবে প্রাথমিক অনুমোদন দেওয়া হয়েছে। এখন এডমিন চূড়ান্ত অনুমোদন দেবেন।'
          : 'শিক্ষকের আবেদন বাতিল করা হয়েছে।',
      };
    } else {
      const [student] = await this.database
        .select({ profile: studentProfiles, user: users })
        .from(studentProfiles)
        .innerJoin(users, eq(studentProfiles.userId, users.id))
        .where(and(eq(studentProfiles.id, profileId), eq(studentProfiles.organizationId, orgId)))
        .limit(1);

      if (!student) throw new NotFoundException('শিক্ষার্থী প্রোফাইল পাওয়া যায়নি।');

      await this.database
        .update(studentProfiles)
        .set({
          verificationStatus: nextStatus,
          orgApprovedBy: currentUser.id,
          orgApprovedAt: new Date(),
          rejectionReason: approved ? null : reason,
        })
        .where(eq(studentProfiles.id, profileId));

      if (approved) {
        // 1. Notify Admins to give final approval
        await this.notificationsService.createNotification({
          recipientRole: 'admin',
          titleBn: 'প্রতিষ্ঠান কর্তৃক শিক্ষার্থী অনুমোদিত (চূড়ান্ত এডমিন ছাড়পত্র প্রয়োজন)',
          titleEn: 'Student Approved by Org (Final Admin Clearance Needed)',
          messageBn: `প্রতিষ্ঠান কর্তৃক শিক্ষার্থী "${student.user.fullName}" অনুমোদিত হয়েছে। দয়া করে চূড়ান্ত অনুমোদন প্রদান করুন।`,
          messageEn: `Student "${student.user.fullName}" was approved by institution. Pending final admin verification.`,
          type: 'student_affiliation',
          link: '/admin?tab=affiliation_requests',
        });

        // 2. Notify the Student user
        await this.notificationsService.createNotification({
          recipientUserId: student.user.id,
          titleBn: 'প্রতিষ্ঠান আবেদন অনুমোদন করেছে!',
          titleEn: 'Institution Approved Affiliation!',
          messageBn: 'আপনার শিক্ষা প্রতিষ্ঠান আবেদনটি অনুমোদন করেছে। এখন সুপার এডমিনের চূড়ান্ত ছাড়পত্রের অপেক্ষায় রয়েছে।',
          messageEn: 'Your institution approved your affiliation. Final verification by admin is in progress.',
          type: 'student_affiliation',
          link: '/student',
        });
      }

        return {
          success: true,
          message: approved
            ? 'শিক্ষার্থীকে সফলভাবে প্রাথমিক অনুমোদন দেওয়া হয়েছে। এখন এডমিন চূড়ান্ত অনুমোদন দেবেন।'
            : 'শিক্ষার্থীর আবেদন বাতিল করা হয়েছে।',
        };
      }
    }

  async correctStudentBeforeApproval(
    currentUser: any,
    profileId: string,
    updateData: any
  ) {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি কোনো অনুমোদিত প্রতিষ্ঠানের সাথে যুক্ত নয়।');
    }

    const [student] = await this.database
      .select({ profile: studentProfiles, user: users })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(and(eq(studentProfiles.id, profileId), eq(studentProfiles.organizationId, orgId)))
      .limit(1);

    if (!student) throw new NotFoundException('শিক্ষার্থী প্রোফাইল পাওয়া যায়নি।');

    if (student.profile.orgApprovedAt || student.profile.verificationStatus === 'verified') {
      throw new BadRequestException('প্রতিষ্ঠান ইতিমধ্যে অনুমোদন সম্পন্ন করেছে বিধায় আর সংশোধন করা সম্ভব নয়।');
    }

    // 1. Update user fields
    const userUpdates: any = {};
    if (updateData.fullName && typeof updateData.fullName === 'string' && updateData.fullName.trim()) {
      userUpdates.fullName = updateData.fullName.trim();
    }
    if (Object.keys(userUpdates).length > 0) {
      await this.database.update(users).set(userUpdates).where(eq(users.id, student.user.id));
    }

    // 2. Update student profile fields
    const profileUpdates: any = {};
    if (updateData.fatherName !== undefined) profileUpdates.fatherName = (updateData.fatherName || '').trim() || null;
    if (updateData.className !== undefined) profileUpdates.className = (updateData.className || '').trim() || null;
    if (updateData.department !== undefined) profileUpdates.department = (updateData.department || '').trim() || null;
    if (updateData.rollNumber !== undefined) {
      profileUpdates.rollNumber = (updateData.rollNumber || '').trim() || null;
      profileUpdates.studentClassRoll = (updateData.rollNumber || '').trim() || null;
    }
    if (updateData.dateOfBirth !== undefined) profileUpdates.dateOfBirth = (updateData.dateOfBirth || '').trim() || null;
    if (updateData.nidOrBirthCertificateNumber !== undefined) {
      profileUpdates.nidOrBirthCertificateNumber = (updateData.nidOrBirthCertificateNumber || '').trim() || null;
    }
    if (updateData.permanentAddress !== undefined) profileUpdates.permanentAddress = (updateData.permanentAddress || '').trim() || null;
    if (updateData.presentAddress !== undefined) {
      profileUpdates.presentAddress = (updateData.presentAddress || '').trim() || null;
      profileUpdates.address = (updateData.presentAddress || '').trim() || null;
    }
    if (updateData.guardianName !== undefined) profileUpdates.guardianName = (updateData.guardianName || '').trim() || null;
    if (updateData.guardianPhone !== undefined) profileUpdates.guardianPhone = (updateData.guardianPhone || '').trim() || null;
    if (updateData.guardianRelationship !== undefined) profileUpdates.guardianRelationship = (updateData.guardianRelationship || '').trim() || null;
    if (updateData.guardianAddress !== undefined) profileUpdates.guardianAddress = (updateData.guardianAddress || '').trim() || null;
    if (updateData.bloodGroup !== undefined) profileUpdates.bloodGroup = (updateData.bloodGroup || '').trim() || null;

    if (Object.keys(profileUpdates).length > 0) {
      await this.database
        .update(studentProfiles)
        .set(profileUpdates)
        .where(eq(studentProfiles.id, profileId));
    }

    return {
      success: true,
      message: 'শিক্ষার্থীর তথ্য সফলভাবে সংশোধন করা হয়েছে।',
    };
  }

  async getOrganizationMembers(currentUser: any, identifier: string) {
    let org: any = null;

    if (identifier === 'my') {
      const resolved = await this.resolveOrgId(currentUser);
      identifier = resolved || currentUser.id;
    }

    // 1. Try to find by organization id directly
    const [foundById] = await this.database
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, identifier), isNull(organizations.deletedAt)))
      .limit(1);

    if (foundById) {
      org = foundById;
    } else {
      // 2. Try to find by user id (if organization account user id was passed)
      const [targetUser] = await this.database
        .select()
        .from(users)
        .where(and(eq(users.id, identifier), isNull(users.deletedAt)))
        .limit(1);

      if (targetUser?.organizationId) {
        const [foundByOrgId] = await this.database
          .select()
          .from(organizations)
          .where(and(eq(organizations.id, targetUser.organizationId), isNull(organizations.deletedAt)))
          .limit(1);
        org = foundByOrgId;
      } else if (targetUser) {
        const [foundByRequester] = await this.database
          .select()
          .from(organizations)
          .where(and(eq(organizations.requestedByUserId, targetUser.id), isNull(organizations.deletedAt)))
          .limit(1);
        org = foundByRequester;
      }
    }

    if (!org) {
      throw new NotFoundException('উক্ত প্রতিষ্ঠানের কোনো তথ্য পাওয়া যায়নি।');
    }

    // Authorization check: Admins, the organization itself, or affiliated teachers
    const isAdmin =
      currentUser.role === 'master_admin' ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin';
    const isOwner =
      currentUser.organizationId === org.id ||
      org.requestedByUserId === currentUser.id ||
      org.id === currentUser.organizationId;
    const isTeacher =
      currentUser.role === 'teacher' && currentUser.organizationId === org.id;

    if (!isAdmin && !isOwner && !isTeacher) {
      throw new ForbiddenException('প্রতিষ্ঠানের সদস্য তালিকা দেখার অনুমতি আপনার নেই।');
    }

    // Fetch affiliated teachers
    const teacherRows = await this.database
      .select({
        profile: teacherProfiles,
        user: users,
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .where(and(eq(teacherProfiles.organizationId, org.id), isNull(users.deletedAt)))
      .orderBy(desc(teacherProfiles.createdAt));

    // Fetch affiliated students
    const studentRows = await this.database
      .select({
        profile: studentProfiles,
        user: users,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(and(eq(studentProfiles.organizationId, org.id), isNull(users.deletedAt)))
      .orderBy(desc(studentProfiles.createdAt));

    return {
      organization: {
        id: org.id,
        name: org.name,
        contactPhone: org.contactPhone,
        contactPerson: org.contactPerson,
        email: org.email,
        address: org.address,
        type: org.type,
        status: org.status,
        registrationNumber: org.registrationNumber,
      },
      teachers: teacherRows.map((r) => ({
        id: r.user.id,
        profileId: r.profile.id,
        fullName: r.user.fullName,
        email: r.user.email,
        phone: r.user.phone || '',
        status: r.user.status,
        department: r.profile.department || 'সাধারণ',
        designation: r.profile.designation || 'শিক্ষক',
        employeeId: r.profile.employeeId || '',
        verificationStatus: r.profile.verificationStatus,
        createdAt: r.profile.createdAt,
      })),
      students: studentRows.map((r) => ({
        id: r.user.id,
        profileId: r.profile.id,
        fullName: r.user.fullName,
        email: r.user.email,
        phone: r.user.phone || '',
        status: r.user.status,
        className: r.profile.className || '',
        department: r.profile.department || '',
        rollNumber: r.profile.rollNumber || r.profile.studentClassRoll || '',
        fatherName: r.profile.fatherName || '',
        guardianName: r.profile.guardianName || '',
        guardianPhone: r.profile.guardianPhone || '',
        bloodGroup: r.profile.bloodGroup || '',
        presentAddress: r.profile.presentAddress || r.profile.address || '',
        verificationStatus: r.profile.verificationStatus,
        createdAt: r.profile.createdAt,
      })),
    };
  }

  async getOrganizationStudentDonations(currentUser: any) {
    const orgId = await this.resolveOrgId(currentUser);
    if (!orgId) return [];

    const donorUsers = alias(users, 'donor_users');

    const donationRows = await this.database
      .select({
        id: donations.id,
        amount: donations.amount,
        paymentMethod: donations.paymentMethod,
        transactionReference: donations.transactionReference,
        status: donations.status,
        rejectionReason: donations.rejectionReason,
        donorNote: donations.donorNote,
        isRandom: donations.isRandom,
        createdAt: donations.createdAt,
        postId: studentPosts.id,
        postTitle: studentPosts.title,
        studentId: users.id,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        className: studentProfiles.className,
        rollNumber: studentProfiles.rollNumber,
        studentClassRoll: studentProfiles.studentClassRoll,
        donorName: sql<string>`COALESCE(${donorUsers.fullName}, 'শুভাকাঙ্ক্ষী (গোপন অনুদানকারী)')`,
        donorEmail: donorUsers.email,
      })
      .from(donations)
      .innerJoin(studentPosts, eq(donations.postId, studentPosts.id))
      .innerJoin(users, eq(studentPosts.studentId, users.id))
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .leftJoin(donorUsers, eq(donations.donorId, donorUsers.id))
      .where(
        and(
          eq(studentPosts.organizationId, orgId),
          isNull(studentPosts.deletedAt)
        )
      )
      .orderBy(desc(donations.createdAt));

    return donationRows;
  }

  async getOrganizationTransferRequests(currentUser: any) {
    const orgId = await this.resolveOrgId(currentUser);
    if (!orgId) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি কোনো অনুমোদিত প্রতিষ্ঠানের সাথে যুক্ত নয়।');
    }

    const records = await this.database
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
      .where(
        or(
          eq(institutionTransfers.currentOrgId, orgId),
          eq(institutionTransfers.targetOrgId, orgId)
        )
      )
      .orderBy(desc(institutionTransfers.createdAt));

    const allOrgIds = Array.from(
      new Set(records.flatMap((r) => [r.currentOrgId, r.targetOrgId]))
    );
    const orgsList = allOrgIds.length
      ? await this.database
          .select({
            id: organizations.id,
            name: organizations.name,
            address: organizations.address,
          })
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
      outgoing: mapped.filter(
        (r) => r.currentOrgId === orgId && r.status === 'pending_current_org'
      ),
      incoming: mapped.filter(
        (r) => r.targetOrgId === orgId && r.status === 'current_org_approved'
      ),
      history: mapped.filter(
        (r) =>
          ['target_org_approved', 'approved', 'rejected'].includes(r.status) ||
          (r.currentOrgId === orgId && r.status !== 'pending_current_org') ||
          (r.targetOrgId === orgId && r.status !== 'current_org_approved')
      ),
    };
  }

  async reviewTransferByOrg(
    currentUser: any,
    transferId: string,
    approved: boolean,
    reason?: string
  ) {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি কোনো অনুমোদিত প্রতিষ্ঠানের সাথে যুক্ত নয়।');
    }

    const [transfer] = await this.database
      .select()
      .from(institutionTransfers)
      .where(eq(institutionTransfers.id, transferId))
      .limit(1);

    if (!transfer) {
      throw new NotFoundException('স্থানান্তরের আবেদনটি পাওয়া যায়নি।');
    }

    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, transfer.userId))
      .limit(1);

    const [currentOrg] = await this.database
      .select()
      .from(organizations)
      .where(eq(organizations.id, transfer.currentOrgId))
      .limit(1);

    const [targetOrg] = await this.database
      .select()
      .from(organizations)
      .where(eq(organizations.id, transfer.targetOrgId))
      .limit(1);

    const roleNameBn = transfer.userRole === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী';
    const roleNameEn = transfer.userRole === 'teacher' ? 'Teacher' : 'Student';

    // SCENARIO 1: CURRENT ORG REVIEW (STAGE 1: Release Approval)
    if (transfer.currentOrgId === orgId) {
      if (transfer.status !== 'pending_current_org') {
        throw new BadRequestException('এই আবেদনটি বর্তমানে আপনার প্রতিষ্ঠানের ছাড়পত্রের অপেক্ষায় নেই।');
      }

      if (approved) {
        await this.database
          .update(institutionTransfers)
          .set({
            status: 'current_org_approved',
            currentOrgApprovedBy: currentUser.id,
            currentOrgApprovedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(institutionTransfers.id, transferId));

        // 1. Notify Target Org (New institution now gets request just like initial affiliation!)
        await this.notificationsService.createNotification({
          recipientOrgId: transfer.targetOrgId,
          titleBn: `নতুন ${roleNameBn} স্থানান্তরের আবেদন এসেছে`,
          titleEn: `Incoming ${roleNameEn} Transfer Request`,
          messageBn: `${roleNameBn} "${user?.fullName}" আপনার প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন করেছেন (পূর্বের প্রতিষ্ঠান ছাড়পত্র দিয়েছে)।`,
          messageEn: `${roleNameEn} "${user?.fullName}" requested to transfer to your institution (released by current institution).`,
          type: 'transfer_request',
          link: '/organization?tab=transfers',
        });

        // 2. Notify Admins
        await this.notificationsService.createNotification({
          recipientRole: 'admin',
          titleBn: 'প্রতিষ্ঠান ছাড়পত্র সম্পন্ন (স্থানান্তর)',
          titleEn: 'Institution Released Member',
          messageBn: `"${currentOrg?.name}" প্রতিষ্ঠান ${roleNameBn} "${user?.fullName}"-এর ছাড়পত্র অনুমোদন করেছে। এখন "${targetOrg?.name}"-এর সিদ্ধান্তের অপেক্ষায়।`,
          messageEn: `"${currentOrg?.name}" released ${roleNameEn} "${user?.fullName}". Awaiting "${targetOrg?.name}" response.`,
          type: 'transfer_update',
          link: '/admin?tab=transfer_requests',
        });

        // 3. Notify User
        await this.notificationsService.createNotification({
          recipientUserId: transfer.userId,
          titleBn: 'বর্তমান প্রতিষ্ঠান ছাড়পত্র দিয়েছে!',
          titleEn: 'Current Institution Granted Clearance',
          messageBn: `আপনার বর্তমান প্রতিষ্ঠান "${currentOrg?.name}" ছাড়পত্র দিয়েছে। এখন নতুন প্রতিষ্ঠান "${targetOrg?.name}"-এর সম্মতির অপেক্ষায় রয়েছে।`,
          messageEn: `Clearance granted by "${currentOrg?.name}". Waiting for acceptance from "${targetOrg?.name}".`,
          type: 'transfer_update',
          link: transfer.userRole === 'teacher' ? '/teacher' : '/student',
        });

        return {
          success: true,
          message: 'ছাড়পত্র সফলভাবে অনুমোদন করা হয়েছে। আবেদনটি নতুন শিক্ষা প্রতিষ্ঠানের নিকট পাঠানো হয়েছে।',
        };
      } else {
        await this.database
          .update(institutionTransfers)
          .set({
            status: 'rejected',
            currentOrgRejectionReason: reason?.trim() || 'প্রতিষ্ঠান কর্তৃক ছাড়পত্র বাতিল করা হয়েছে।',
            rejectionStage: 'current_org',
            updatedAt: new Date(),
          })
          .where(eq(institutionTransfers.id, transferId));

        await this.notificationsService.createNotification({
          recipientUserId: transfer.userId,
          titleBn: 'প্রতিষ্ঠান ছাড়পত্রের আবেদন বাতিল করা হয়েছে',
          titleEn: 'Clearance Request Rejected by Institution',
          messageBn: `আপনার বর্তমান প্রতিষ্ঠান "${currentOrg?.name}" ছাড়পত্রের আবেদন বাতিল করেছে। কারণ: ${reason?.trim() || 'কারণ উল্লেখ নেই'}`,
          messageEn: `Your clearance request was rejected by "${currentOrg?.name}". Reason: ${reason?.trim() || 'No reason provided'}`,
          type: 'transfer_rejected',
          link: transfer.userRole === 'teacher' ? '/teacher' : '/student',
        });

        return {
          success: true,
          message: 'ছাড়পত্রের আবেদন বাতিল করা হয়েছে।',
        };
      }
    }

    // SCENARIO 2: TARGET ORG REVIEW (STAGE 2: Acceptance)
    else if (transfer.targetOrgId === orgId) {
      if (transfer.status !== 'current_org_approved') {
        throw new BadRequestException('এই আবেদনটি বর্তমানে আপনার প্রতিষ্ঠানের গ্রহণের অপেক্ষায় নেই।');
      }

      if (approved) {
        await this.database
          .update(institutionTransfers)
          .set({
            status: 'target_org_approved',
            targetOrgApprovedBy: currentUser.id,
            targetOrgApprovedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(institutionTransfers.id, transferId));

        // 1. Notify Admins (Super Admin & Master Admin) for FINAL clearance!
        await this.notificationsService.createNotification({
          recipientRole: 'admin',
          titleBn: 'উভয় প্রতিষ্ঠান কর্তৃক স্থানান্তর অনুমোদিত (চূড়ান্ত এডমিন ছাড়পত্র প্রয়োজন)',
          titleEn: 'Transfer Approved by Both Orgs (Final Admin Clearance Needed)',
          messageBn: `${roleNameBn} "${user?.fullName}"-এর স্থানান্তর আবেদন উভয় শিক্ষা প্রতিষ্ঠান অনুমোদন করেছে। দয়া করে চূড়ান্ত অনুমোদন প্রদান করুন।`,
          messageEn: `${roleNameEn} "${user?.fullName}"'s transfer approved by both institutions. Awaiting final Administrator clearance.`,
          type: 'transfer_request',
          link: '/admin?tab=transfer_requests',
        });

        // 2. Notify User
        await this.notificationsService.createNotification({
          recipientUserId: transfer.userId,
          titleBn: 'নতুন প্রতিষ্ঠান আবেদন গ্রহণ করেছে!',
          titleEn: 'New Institution Accepted Affiliation',
          messageBn: `নতুন শিক্ষা প্রতিষ্ঠান "${targetOrg?.name}" আপনার আবেদন গ্রহণ করেছে। এখন সুপার এডমিন ও মাস্টার এডমিনের চূড়ান্ত অনুমোদনের অপেক্ষায় রয়েছে।`,
          messageEn: `"${targetOrg?.name}" accepted your transfer request. Final clearance by Administrator is now in progress.`,
          type: 'transfer_update',
          link: transfer.userRole === 'teacher' ? '/teacher' : '/student',
        });

        return {
          success: true,
          message: 'নতুন শিক্ষার্থী/শিক্ষক স্থানান্তর সফলভাবে গ্রহণ করা হয়েছে। চূড়ান্ত অনুমোদনের জন্য এডমিনের কাছে পাঠানো হয়েছে।',
        };
      } else {
        await this.database
          .update(institutionTransfers)
          .set({
            status: 'rejected',
            targetOrgRejectionReason: reason?.trim() || 'নতুন প্রতিষ্ঠান কর্তৃক স্থানান্তর আবেদন বাতিল করা হয়েছে।',
            rejectionStage: 'target_org',
            updatedAt: new Date(),
          })
          .where(eq(institutionTransfers.id, transferId));

        await this.notificationsService.createNotification({
          recipientUserId: transfer.userId,
          titleBn: 'নতুন প্রতিষ্ঠান স্থানান্তরের আবেদন বাতিল করেছে',
          titleEn: 'Transfer Request Rejected by New Institution',
          messageBn: `নতুন শিক্ষা প্রতিষ্ঠান "${targetOrg?.name}" আপনার আবেদন গ্রহণ করেনি। কারণ: ${reason?.trim() || 'কারণ উল্লেখ নেই'}`,
          messageEn: `Your transfer request was rejected by "${targetOrg?.name}". Reason: ${reason?.trim() || 'No reason provided'}`,
          type: 'transfer_rejected',
          link: transfer.userRole === 'teacher' ? '/teacher' : '/student',
        });

        return {
          success: true,
          message: 'স্থানান্তরের আবেদন বাতিল করা হয়েছে।',
        };
      }
    } else {
      throw new ForbiddenException('আপনি এই স্থানান্তর আবেদনটি পর্যালোচনা করার জন্য অনুমোদিত নন।');
    }
  }

  async requestMemberRemoval(
    currentUser: any,
    role: 'teacher' | 'student',
    targetUserId: string,
    reason: string
  ) {
    const orgId = await this.resolveOrgId(currentUser);
    if (!orgId) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি কোনো অনুমোদিত প্রতিষ্ঠানের সাথে যুক্ত নয়।');
    }

    const cleanReason = reason?.trim();
    if (!cleanReason || cleanReason.length < 5) {
      throw new BadRequestException('অনুগ্রহ করে সদস্য রিমুভের সুস্পষ্ট কারণ লিখুন (কমপক্ষে ৫ অক্ষর)।');
    }

    // Verify target user belongs to this org
    let finalUserId = targetUserId;
    let [targetUser] = await this.database
      .select()
      .from(users)
      .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
      .limit(1);

    if (!targetUser) {
      if (role === 'student') {
        const [sp] = await this.database
          .select({ userId: studentProfiles.userId })
          .from(studentProfiles)
          .where(eq(studentProfiles.id, targetUserId))
          .limit(1);
        if (sp) {
          finalUserId = sp.userId;
          [targetUser] = await this.database
            .select()
            .from(users)
            .where(and(eq(users.id, sp.userId), isNull(users.deletedAt)))
            .limit(1);
        }
      } else if (role === 'teacher') {
        const [tp] = await this.database
          .select({ userId: teacherProfiles.userId })
          .from(teacherProfiles)
          .where(eq(teacherProfiles.id, targetUserId))
          .limit(1);
        if (tp) {
          finalUserId = tp.userId;
          [targetUser] = await this.database
            .select()
            .from(users)
            .where(and(eq(users.id, tp.userId), isNull(users.deletedAt)))
            .limit(1);
        }
      }
    }

    if (!targetUser) {
      throw new NotFoundException('সদস্য অ্যাকাউন্টটি পাওয়া যায়নি।');
    }

    if (targetUser.organizationId !== orgId) {
      throw new BadRequestException('উক্ত সদস্য আপনার শিক্ষা প্রতিষ্ঠানের সাথে যুক্ত নন।');
    }

    // Check if there is already a pending removal request
    const [existing] = await this.database
      .select()
      .from(orgMemberRemovals)
      .where(
        and(
          eq(orgMemberRemovals.organizationId, orgId),
          eq(orgMemberRemovals.userId, finalUserId),
          eq(orgMemberRemovals.status, 'pending')
        )
      )
      .limit(1);

    if (existing) {
      throw new BadRequestException('এই সদস্যের রিমুভ আবেদন ইতিমধ্যে পর্যালোচনায় অপেক্ষমাণ রয়েছে।');
    }

    const [org] = await this.database
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const removalId = randomUUID();
    await this.database.insert(orgMemberRemovals).values({
      id: removalId,
      organizationId: orgId,
      userId: finalUserId,
      userRole: role,
      reason: cleanReason,
      status: 'pending',
      requestedByUserId: currentUser.id,
    });

    const roleNameBn = role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী';
    const roleNameEn = role === 'teacher' ? 'Teacher' : 'Student';

    // Notify Master Admin & Super Admins
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
      requiredPermission: PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
      titleBn: 'প্রতিষ্ঠান থেকে সদস্য রিমুভ আবেদন',
      titleEn: 'Member Removal Request from Organization',
      messageBn: `"${org?.name || 'প্রতিষ্ঠান'}" প্রতিষ্ঠান থেকে ${roleNameBn} "${targetUser.fullName}"-কে রিমুভ করার আবেদন জমা দেওয়া হয়েছে। কারণ: "${cleanReason}"`,
      messageEn: `Institution "${org?.name || ''}" requested removal of ${roleNameEn} "${targetUser.fullName}". Reason: "${cleanReason}"`,
      type: 'member_removal',
      link: '/admin?tab=affiliation_requests',
    });

    return {
      success: true,
      message: `${roleNameBn} "${targetUser.fullName}"-কে প্রতিষ্ঠান থেকে রিমুভ করার আবেদন সফলভাবে জমা হয়েছে। এডমিন অনুমোদনের অপেক্ষায় রয়েছে।`,
      removalId,
    };
  }

  async listRemovalRequests(currentUser: any) {
    const isAdmin = ['master_admin', 'super_admin', 'admin'].includes(currentUser.role);
    const orgId = await this.resolveOrgId(currentUser);

    const baseQuery = this.database
      .select({
        id: orgMemberRemovals.id,
        organizationId: orgMemberRemovals.organizationId,
        orgName: organizations.name,
        userId: orgMemberRemovals.userId,
        userName: users.fullName,
        userEmail: users.email,
        userPhone: users.phone,
        userRole: orgMemberRemovals.userRole,
        reason: orgMemberRemovals.reason,
        status: orgMemberRemovals.status,
        requestedByUserId: orgMemberRemovals.requestedByUserId,
        adminReviewedBy: orgMemberRemovals.adminReviewedBy,
        adminReviewedAt: orgMemberRemovals.adminReviewedAt,
        adminRejectionReason: orgMemberRemovals.adminRejectionReason,
        createdAt: orgMemberRemovals.createdAt,
        updatedAt: orgMemberRemovals.updatedAt,
      })
      .from(orgMemberRemovals)
      .innerJoin(organizations, eq(orgMemberRemovals.organizationId, organizations.id))
      .innerJoin(users, eq(orgMemberRemovals.userId, users.id));

    if (isAdmin) {
      return await baseQuery.orderBy(desc(orgMemberRemovals.createdAt));
    } else if (orgId) {
      return await baseQuery
        .where(eq(orgMemberRemovals.organizationId, orgId))
        .orderBy(desc(orgMemberRemovals.createdAt));
    }
    return [];
  }

  async reviewMemberRemoval(
    adminUser: any,
    removalId: string,
    approved: boolean,
    rejectionReason?: string
  ) {
    const [removal] = await this.database
      .select()
      .from(orgMemberRemovals)
      .where(eq(orgMemberRemovals.id, removalId))
      .limit(1);

    if (!removal) {
      throw new NotFoundException('রিমুভ আবেদনটি পাওয়া যায়নি।');
    }

    if (removal.status !== 'pending') {
      throw new BadRequestException('এই আবেদনটি ইতিমধ্যে নিষ্পত্তি করা হয়েছে।');
    }

    const [org] = await this.database
      .select()
      .from(organizations)
      .where(eq(organizations.id, removal.organizationId))
      .limit(1);

    const [targetUser] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, removal.userId))
      .limit(1);

    if (approved) {
      await this.database
        .update(orgMemberRemovals)
        .set({
          status: 'approved',
          adminReviewedBy: adminUser.id,
          adminReviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orgMemberRemovals.id, removalId));

      // Clear organizationId from target user
      await this.database
        .update(users)
        .set({
          organizationId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, removal.userId));

      if (removal.userRole === 'student') {
        await this.database
          .update(studentProfiles)
          .set({
            organizationId: null,
            verificationStatus: 'pending_org',
            updatedAt: new Date(),
          })
          .where(eq(studentProfiles.userId, removal.userId));
      } else if (removal.userRole === 'teacher') {
        await this.database
          .update(teacherProfiles)
          .set({
            organizationId: null,
            verificationStatus: 'pending_org',
            updatedAt: new Date(),
          })
          .where(eq(teacherProfiles.userId, removal.userId));
      }

      // Notify the target user
      await this.notificationsService.createNotification({
        recipientUserId: removal.userId,
        titleBn: 'প্রতিষ্ঠান সংযুক্তি অবসান ও রিমুভ সম্পন্ন',
        titleEn: 'Institution Affiliation Released',
        messageBn: `কর্তৃপক্ষ কর্তৃক "${org?.name || 'প্রতিষ্ঠান'}" থেকে আপনার সংযুক্তি অবসান (রিমুভ) অনুমোদন করা হয়েছে। আপনার পূর্বের সকল নিজস্ব রেকর্ড সংরক্ষিত থাকবে।`,
        messageEn: `Your affiliation with "${org?.name || ''}" has been released by authority. Your past individual records remain intact.`,
        type: 'member_removal',
        link: removal.userRole === 'teacher' ? '/teacher' : '/student',
      });

      // Notify the organization
      await this.notificationsService.createNotification({
        recipientOrgId: removal.organizationId,
        recipientRole: 'organization',
        titleBn: 'সদস্য রিমুভ আবেদন অনুমোদিত হয়েছে',
        titleEn: 'Member Removal Approved',
        messageBn: `${removal.userRole === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} "${targetUser?.fullName || ''}"-কে আপনার প্রতিষ্ঠান থেকে সফলভাবে রিমুভ করা হয়েছে।`,
        messageEn: `${removal.userRole === 'teacher' ? 'Teacher' : 'Student'} "${targetUser?.fullName || ''}" was successfully removed from your institution.`,
        type: 'member_removal',
        link: '/organization?tab=affiliations',
      });

      return {
        success: true,
        message: 'সদস্যকে প্রতিষ্ঠান থেকে সফলভাবে রিমুভ ও অনুমোদন করা হয়েছে।',
      };
    } else {
      await this.database
        .update(orgMemberRemovals)
        .set({
          status: 'rejected',
          adminReviewedBy: adminUser.id,
          adminReviewedAt: new Date(),
          adminRejectionReason: rejectionReason?.trim() || 'কর্তৃপক্ষ আবেদনটি অনুমোদন করেনি।',
          updatedAt: new Date(),
        })
        .where(eq(orgMemberRemovals.id, removalId));

      // Notify the organization
      await this.notificationsService.createNotification({
        recipientOrgId: removal.organizationId,
        recipientRole: 'organization',
        titleBn: 'সদস্য রিমুভ আবেদন বাতিল করা হয়েছে',
        titleEn: 'Member Removal Rejected',
        messageBn: `"${targetUser?.fullName || ''}"-এর রিমুভ আবেদনটি কর্তৃপক্ষ কর্তৃক বাতিল করা হয়েছে। কারণ: ${rejectionReason || 'যথাযথ কারণ দর্শানো হয়নি'}`,
        messageEn: `Removal request for "${targetUser?.fullName || ''}" was rejected. Reason: ${rejectionReason || 'Insufficient grounds'}`,
        type: 'member_removal',
        link: '/organization?tab=affiliations',
      });

      return {
        success: true,
        message: 'সদস্য রিমুভ আবেদনটি বাতিল করা হয়েছে।',
      };
    }
  }
}
