import { Injectable, Inject } from '@nestjs/common';
import { db, DrizzleDB } from '../../database';
import { DRIZZLE_DB } from '../../database/database.module';
import { notifications } from '../../database/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface CreateNotificationDto {
  recipientUserId?: string;
  recipientRole?: 'master_admin' | 'super_admin' | 'admin' | 'organization' | 'teacher' | 'student' | 'donor';
  recipientOrgId?: string;
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

  async createNotification(data: CreateNotificationDto) {
    const id = randomUUID();
    await this.database.insert(notifications).values({
      id,
      recipientUserId: data.recipientUserId || null,
      recipientRole: data.recipientRole || null,
      recipientOrgId: data.recipientOrgId || null,
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
    const conditions: any[] = [];

    if (user.id) {
      conditions.push(eq(notifications.recipientUserId, user.id));
    }

    if (user.role) {
      conditions.push(eq(notifications.recipientRole, user.role));
      // Master and Super Admins receive all administrative notifications
      if (user.role === 'super_admin' || user.role === 'master_admin') {
        conditions.push(eq(notifications.recipientRole, 'admin'));
        conditions.push(eq(notifications.recipientRole, 'super_admin'));
        conditions.push(eq(notifications.recipientRole, 'master_admin'));
      }
    }

    if (user.organizationId) {
      conditions.push(eq(notifications.recipientOrgId, user.organizationId));
    }

    if (conditions.length === 0) return [];

    return await this.database
      .select()
      .from(notifications)
      .where(or(...conditions))
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
