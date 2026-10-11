import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DrizzleDB } from '../../database';
import { DRIZZLE_DB } from '../../database/database.module';
import { organizations, users, studentProfiles, teacherProfiles } from '../../database/schema';
import { eq, and, isNull, desc, sql, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

export interface ApplyOrgDto {
  name: string;
  address: string;
  phone: string;
  email?: string;
  type?: string;
  description?: string;
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
          type: dto.type?.trim() || 'qawmi_madrasa',
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
        type: dto.type?.trim() || 'qawmi_madrasa',
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

    // Dispatch Notification to Super Admin and Master Admin
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
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

    // Notify Super Admin for Physical Verification
    await this.notificationsService.createNotification({
      recipientRole: 'admin',
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

  async getPendingAffiliations(currentUser: any) {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      return { teachers: [], students: [] };
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

    return {
      teachers: pendingTeachers,
      students: pendingStudents,
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

    // Authorization check: Admins or the organization itself
    const isAdmin =
      currentUser.role === 'master_admin' ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin';
    const isOwner = currentUser.organizationId === org.id || org.requestedByUserId === currentUser.id;

    if (!isAdmin && !isOwner) {
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
}
