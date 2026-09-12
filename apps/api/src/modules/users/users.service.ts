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
} from '../../database';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { eq, and, isNull, desc } from 'drizzle-orm';
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
    private readonly firebaseAdmin: FirebaseAdminService
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

    // 1. Create or get user in Firebase Auth with default password 'pass1233'
    const fbUser = await this.firebaseAdmin.createOrUpdateUser({
      email: input.email,
      password: 'pass1233',
      displayName: input.fullName,
      phoneNumber: input.phone,
    });

    const newUserId = crypto.randomUUID();

    // 2. Insert into MySQL users table
    await this.db.insert(users).values({
      id: newUserId,
      firebaseUid: fbUser.uid,
      email: input.email,
      phone: input.phone,
      fullName: input.fullName,
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
  }

  async createGeneralUser(creator: any, input: CreateGeneralUserInput) {
    const fbUser = await this.firebaseAdmin.createOrUpdateUser({
      email: input.email,
      password: 'pass1233',
      displayName: input.fullName,
      phoneNumber: input.phone,
    });

    const newUserId = crypto.randomUUID();

    await this.db.insert(users).values({
      id: newUserId,
      firebaseUid: fbUser.uid,
      email: input.email,
      phone: input.phone,
      fullName: input.fullName,
      role: input.role,
      organizationId: input.organizationId,
      status: 'active',
      isPasswordSet: true,
      mustChangePassword: true,
    });

    return {
      success: true,
      message: `${input.role} created successfully with default password pass1233`,
      userId: newUserId,
    };
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
}
