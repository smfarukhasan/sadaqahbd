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
} from '../../database';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { NotificationsService } from '../notifications/notifications.service';
import { eq, and, or, isNull, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  CreateAdminUserInput,
  CreateGeneralUserInput,
  StudentVerificationProfileInput,
  UserRole,
  UserRoleType,
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

    // 1. Create or get user in Firebase Auth with default password 'pass1233'
    const fbUser = await this.firebaseAdmin.createOrUpdateUser({
      email: cleanEmail,
      password: 'pass1233',
      displayName: input.fullName.trim(),
      phoneNumber: cleanPhone || undefined,
    });

    const newUserId = crypto.randomUUID();

    try {
      // 2. Insert into MySQL users table (phone is guaranteed null if empty, preventing unique index collision)
      await this.db.insert(users).values({
        id: newUserId,
        firebaseUid: fbUser.uid,
        email: cleanEmail,
        phone: cleanPhone,
        fullName: input.fullName.trim(),
        role: input.role,
        status: 'active',
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

  async deleteUser(targetUserId: string, requester: any) {
    const target = await this.db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (target.length === 0) {
      throw new NotFoundException('User not found');
    }

    const targetUser = target[0];

    // Master Admin cannot be deleted by ANYONE
    if (targetUser.role === UserRole.MASTER_ADMIN) {
      throw new ForbiddenException('Master Admin cannot be deleted or modified');
    }

    // Super Admin can delete users if permitted, but cannot delete another Super Admin unless permitted
    if (targetUser.role === UserRole.SUPER_ADMIN && requester.role !== UserRole.MASTER_ADMIN) {
      const canDeleteSuper = requester.permissions?.some(
        (p: any) =>
          p.moduleKey === 'admin_users.super_admin_list' && p.canDelete
      );
      if (!canDeleteSuper) {
        throw new ForbiddenException('You do not have permission to delete Super Admins');
      }
    }

    // Soft delete
    await this.db
      .update(users)
      .set({ deletedAt: new Date(), status: 'suspended' })
      .where(eq(users.id, targetUserId));

    return { success: true, message: 'User deleted successfully' };
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
        status: organizations.status,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(and(eq(organizations.status, 'pending'), isNull(organizations.deletedAt)))
      .orderBy(desc(organizations.createdAt));

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

    if (org && org.requestedByUserId) {
      await this.db
        .update(users)
        .set({
          status: approved ? 'active' : 'rejected',
          organizationId: orgId,
        })
        .where(eq(users.id, org.requestedByUserId));

      await this.notificationsService.createNotification({
        recipientUserId: org.requestedByUserId,
        titleBn: approved ? 'প্রতিষ্ঠান অনুমোদিত হয়েছে!' : 'প্রতিষ্ঠান আবেদন প্রত্যাখ্যাত',
        titleEn: approved ? 'Organization Approved!' : 'Organization Rejected',
        messageBn: approved
          ? `আপনার প্রতিষ্ঠান "${org.name}" সফলভাবে অনুমোদিত হয়েছে। এখন ড্যাশবোর্ডের সব ফিচার সচল।`
          : `আপনার প্রতিষ্ঠানের আবেদনটি এডমিন দ্বারা প্রত্যাখ্যাত হয়েছে। কারণ: ${reason || 'যথাযথ তথ্য পাওয়া যায়নি'}`,
        messageEn: approved
          ? `Your organization "${org.name}" has been approved. All dashboard features are now unlocked.`
          : `Your organization application has been rejected. Reason: ${reason || 'Incomplete details'}`,
        type: 'org_verification',
        link: '/organization',
      });
    }

    await this.db
      .update(users)
      .set({
        status: approved ? 'active' : 'rejected',
      })
      .where(eq(users.id, orgId));

    await this.db
      .update(users)
      .set({
        status: approved ? 'active' : 'rejected',
      })
      .where(eq(users.organizationId, orgId));

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
        titleBn: 'নতুন শিক্ষকের ভেরিফিকেশন আবেদন',
        titleEn: 'New Teacher Affiliation Request',
        messageBn: `শিক্ষক "${currentUser.fullName}" আপনার প্রতিষ্ঠানের সাথে যুক্ত হওয়ার আবেদন করেছেন।`,
        messageEn: `Teacher "${currentUser.fullName}" submitted an affiliation request to your organization.`,
        type: 'teacher_affiliation',
        link: '/organization?tab=affiliations',
      });

      // Notify Super Admins and Master Admin
      await this.notificationsService.createNotification({
        recipientRole: 'admin',
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
        titleBn: 'নতুন শিক্ষার্থীর ভেরিফিকেশন আবেদন',
        titleEn: 'New Student Affiliation Request',
        messageBn: `শিক্ষার্থী "${currentUser.fullName}" আপনার প্রতিষ্ঠানের সাথে যুক্ত হওয়ার আবেদন করেছেন।`,
        messageEn: `Student "${currentUser.fullName}" applied to your institution.`,
        type: 'student_affiliation',
        link: '/organization?tab=affiliations',
      });

      // Notify Super Admins and Master Admin
      await this.notificationsService.createNotification({
        recipientRole: 'admin',
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

      return {
        hasApplied: !!profile,
        profile: profile || null,
        status: profile?.verificationStatus || 'unapplied',
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

      return {
        hasApplied: !!profile,
        profile: profile || null,
        status: profile?.verificationStatus || 'unapplied',
      };
    }

    return { hasApplied: false, profile: null, status: 'unapplied' };
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
}

