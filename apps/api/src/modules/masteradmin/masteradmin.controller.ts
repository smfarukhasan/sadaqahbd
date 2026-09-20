import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { MasterAdminGuard } from '../auth/guards/master-admin.guard';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import { UsersService } from '../users/users.service';
import { DRIZZLE_DB } from '../../database/database.module';
import {
  DrizzleDB,
  users,
  userPermissions,
  donations,
  studentPosts,
  organizations,
} from '../../database';
import { eq, and, or, isNull, sql, desc, inArray } from 'drizzle-orm';
import {
  CreateAdminUserSchema,
  CreateAdminUserInput,
  UpdateUserPermissionsInput,
  UserRole,
  DonationStatus,
  PostVerificationStatus,
} from '@sadaqahbd/schema';

@Controller('masteradmin')
@UseGuards(FirebaseAuthGuard, MasterAdminGuard)
export class MasterAdminController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB
  ) {}

  @Get('dashboard-stats')
  async getStats(@CurrentUser() user: any) {
    // 1. User counts by role
    const userRoleCounts = await this.db
      .select({
        role: users.role,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(users.role);

    const counts: Record<string, number> = {
      master_admin: 1,
      super_admin: 0,
      admin: 0,
      organization: 0,
      teacher: 0,
      student: 0,
      donor: 0,
    };

    let totalUsersCount = 0;
    userRoleCounts.forEach((r) => {
      counts[r.role] = Number(r.count);
      totalUsersCount += Number(r.count);
    });

    // 2. Total accepted donations sum
    const donationSumResult = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${donations.amount}), '0.00')`,
      })
      .from(donations)
      .where(eq(donations.status, DonationStatus.ACCEPTED));

    // 3. Pending verification counters
    const pendingPostsResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(studentPosts)
      .where(
        and(
          eq(studentPosts.verificationStatus, PostVerificationStatus.PENDING_SUPER_ADMIN),
          isNull(studentPosts.deletedAt)
        )
      );

    const pendingOrgsResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(organizations)
      .where(and(eq(organizations.status, 'pending'), isNull(organizations.deletedAt)));

    return {
      masterEmail: user.email,
      fullName: user.fullName,
      status: 'Master Admin Root Access Active',
      timestamp: new Date().toISOString(),
      databaseCharset: 'utf8mb4_unicode_ci',
      totalUsers: totalUsersCount,
      roleCounts: counts,
      totalDonationsAmount: Number(donationSumResult[0]?.total || 0),
      pendingPostsCount: Number(pendingPostsResult[0]?.count || 0),
      pendingOrgsCount: Number(pendingOrgsResult[0]?.count || 0),
    };
  }

  @Get('super-admins')
  async listSuperAdmins(@CurrentUser() user: any) {
    const list = await this.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        address: users.address,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          or(eq(users.role, UserRole.SUPER_ADMIN), eq(users.role, UserRole.ADMIN))
        )
      )
      .orderBy(desc(users.createdAt));

    if (list.length === 0) return [];

    const userIds = list.map((u) => u.id);
    const permissions = await this.db
      .select()
      .from(userPermissions)
      .where(inArray(userPermissions.userId, userIds));

    return list.map((admin) => ({
      ...admin,
      permissions: permissions.filter((p) => p.userId === admin.id),
    }));
  }

  @Get('all-users')
  async listAllUsers(@CurrentUser() user: any) {
    return this.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        address: users.address,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt));
  }

  @Post('super-admins')
  async createSuperAdmin(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    try {
      const targetRole =
        body.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.SUPER_ADMIN;

      let permissions = body.permissions;
      if (!permissions && Array.isArray(body.moduleKeys)) {
        permissions = body.moduleKeys.map((k: string) => ({
          moduleKey: k,
          canView: true,
          canEdit: true,
          canDelete: true,
          canApprove: true,
        }));
      }

      const validated = CreateAdminUserSchema.parse({
        fullName: body.fullName ? String(body.fullName).trim() : '',
        email: body.email ? String(body.email).trim() : '',
        phone: body.phone ? String(body.phone).trim().replace(/[\s-]/g, '') : '',
        role: targetRole,
        permissions: permissions || [],
      });
      return await this.usersService.createAdminUser(user, validated);
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) {
        throw err;
      }
      if (err.name === 'ZodError') {
        const firstIssue = err.issues?.[0];
        const fieldName = firstIssue?.path?.join('.') || 'input';
        throw new BadRequestException(`Validation error on ${fieldName}: ${firstIssue?.message || 'Invalid format'}`);
      }
      throw new BadRequestException(err.message || 'Failed to create administrator account.');
    }
  }

  @Delete('super-admins/:id')
  async deleteSuperAdmin(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.usersService.deleteUser(id, user);
  }

  @Put('super-admins/:id/permissions')
  async updateSuperAdminPermissions(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()
    body: {
      role?: string;
      permissions?: Array<{ moduleKey: string; canView: boolean; canEdit: boolean; canDelete: boolean; canApprove: boolean }>;
      moduleKeys?: string[];
    }
  ) {
    // If role update is requested
    if (body.role && (body.role === UserRole.SUPER_ADMIN || body.role === UserRole.ADMIN)) {
      await this.db.update(users).set({ role: body.role }).where(eq(users.id, id));
    }

    // Convert moduleKeys to permissions array if supplied
    let perms = body.permissions;
    if (!perms && Array.isArray(body.moduleKeys)) {
      perms = body.moduleKeys.map((k) => ({
        moduleKey: k,
        canView: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
      }));
    }

    // Clear existing permissions
    await this.db.delete(userPermissions).where(eq(userPermissions.userId, id));

    // Insert new permissions
    if (perms && perms.length > 0) {
      for (const p of perms) {
        await this.db.insert(userPermissions).values({
          userId: id,
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
      message: 'Administrator permissions and role updated successfully',
    };
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    if (body.status !== 'active' && body.status !== 'suspended') {
      throw new BadRequestException('Status must be either active or suspended');
    }

    const [targetUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (
      targetUser.role === UserRole.MASTER_ADMIN ||
      targetUser.email.toLowerCase() === 'admin@sadaqahbd.com'
    ) {
      throw new BadRequestException('Master Admin root account cannot be suspended or deactivated.');
    }

    await this.db
      .update(users)
      .set({ status: body.status as any })
      .where(eq(users.id, id));

    return {
      success: true,
      id,
      status: body.status,
      message: `User status successfully updated to ${body.status}`,
    };
  }
}
