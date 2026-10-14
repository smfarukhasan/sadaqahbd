import { Injectable, Inject } from '@nestjs/common';
import { db, DrizzleDB } from '../../database';
import { DRIZZLE_DB } from '../../database/database.module';
import { notifications, userPermissions } from '../../database/schema';
import { eq, or, and, desc, inArray, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { PermissionModuleKey, UserRole } from '@sadaqahbd/schema';

export interface CreateNotificationDto {
  recipientUserId?: string;
  recipientRole?: 'master_admin' | 'super_admin' | 'admin' | 'organization' | 'teacher' | 'student' | 'donor';
  recipientOrgId?: string;
  requiredPermission?: string;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  type: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE_DB) private readonly database: DrizzleDB) {}

  /**
   * Automatically resolve the required permission module key based on notification type and link
   */
  resolveRequiredPermission(type: string, link?: string | null): string | null {
    switch (type) {
      case 'student_post_created':
      case 'post_org_approved':
      case 'post_teacher_verified':
        return PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS;

      case 'student_affiliation':
      case 'student_verification_result':
        return PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS;

      case 'teacher_affiliation':
      case 'teacher_verification_result':
        return PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS;

      case 'transfer_request':
      case 'transfer_update':
      case 'transfer_completed':
      case 'transfer_rejected':
        return PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS;

      case 'org_verification':
      case 'member_org_suggestion':
        return PermissionModuleKey.ORG_VERIFICATION_REQUESTS;

      case 'donation_submitted':
      case 'donation_created':
      case 'pending_donation':
        return PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL;

      case 'item_donation_created':
      case 'pending_item_donation':
      case 'item_accepted':
      case 'item_rejected':
        return PermissionModuleKey.ITEM_DONATION_APPROVAL;

      case 'fund_allocated':
        return PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION;

      default:
        if (link?.includes('student_post_requests')) {
          return PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS;
        }
        if (link?.includes('org_requests')) {
          return PermissionModuleKey.ORG_VERIFICATION_REQUESTS;
        }
        if (link?.includes('affiliation_requests')) {
          return PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS;
        }
        if (link?.includes('transfer_requests')) {
          return PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS;
        }
        if (link?.includes('donation_approval')) {
          return PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL;
        }
        return null;
    }
  }

  async createNotification(data: CreateNotificationDto) {
    const id = randomUUID();
    const requiredPermission =
      data.requiredPermission || this.resolveRequiredPermission(data.type, data.link);

    await this.database.insert(notifications).values({
      id,
      recipientUserId: data.recipientUserId || null,
      recipientRole: data.recipientRole || null,
      recipientOrgId: data.recipientOrgId || null,
      requiredPermission: requiredPermission || null,
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      messageBn: data.messageBn,
      messageEn: data.messageEn,
      type: data.type,
      link: data.link || null,
      isRead: false,
    });
    return { id, success: true };
  }

  async getMyNotifications(user: any) {
    if (!user || !user.id) return [];

    // 1. MASTER ADMIN: Full visibility into personal and administrative notifications
    if (user.role === UserRole.MASTER_ADMIN) {
      return await this.database
        .select()
        .from(notifications)
        .where(
          or(
            eq(notifications.recipientUserId, user.id),
            inArray(notifications.recipientRole, ['master_admin', 'super_admin', 'admin'])
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }

    // 2. SUPER ADMIN & ADMIN: Granular Role & Permission Filtering
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      // Fetch fresh permissions from user_permissions table for accuracy
      const perms = await this.database
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));

      const actionableModuleKeys = new Set(
        perms
          .filter((p) => p.canApprove || p.canEdit || p.canView)
          .map((p) => p.moduleKey)
      );

      // Candidate notifications: direct to user, or to admin/super_admin role
      const candidateList = await this.database
        .select()
        .from(notifications)
        .where(
          or(
            eq(notifications.recipientUserId, user.id),
            inArray(notifications.recipientRole, ['super_admin', 'admin'])
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(80);

      // Strict filter:
      // If notification is an administrative request, Super Admin MUST have permission for that module.
      const filtered = candidateList.filter((notif) => {
        // Direct personal notification always allowed
        if (notif.recipientUserId === user.id) return true;

        const reqPerm =
          notif.requiredPermission || this.resolveRequiredPermission(notif.type, notif.link);
        if (!reqPerm) {
          // General system notice to super admins
          return true;
        }

        // Only allow if super admin has permission for this module
        return actionableModuleKeys.has(reqPerm);
      });

      return filtered.slice(0, 50);
    }

    // 3. ORGANIZATION: Only personal or their specific organization's notifications
    if (user.role === UserRole.ORGANIZATION) {
      if (!user.organizationId) {
        return await this.database
          .select()
          .from(notifications)
          .where(eq(notifications.recipientUserId, user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(50);
      }

      return await this.database
        .select()
        .from(notifications)
        .where(
          or(
            eq(notifications.recipientUserId, user.id),
            and(
              eq(notifications.recipientOrgId, user.organizationId),
              or(
                isNull(notifications.recipientRole),
                eq(notifications.recipientRole, 'organization')
              )
            )
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }

    // 4. TEACHER: Only personal or their institution's teacher notifications
    if (user.role === UserRole.TEACHER) {
      if (!user.organizationId) {
        return await this.database
          .select()
          .from(notifications)
          .where(eq(notifications.recipientUserId, user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(50);
      }

      return await this.database
        .select()
        .from(notifications)
        .where(
          or(
            eq(notifications.recipientUserId, user.id),
            and(
              eq(notifications.recipientOrgId, user.organizationId),
              eq(notifications.recipientRole, 'teacher')
            )
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }

    // 5. STUDENT & DONOR: Only direct personal notifications
    return await this.database
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUserId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markAsRead(id: string) {
    await this.database
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return { success: true };
  }
}
