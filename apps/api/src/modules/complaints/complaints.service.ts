import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../database/database.module';
import { DrizzleDB, complaints, users } from '../../database';
import { eq, desc } from 'drizzle-orm';
import {
  CreateComplaintInput,
  ReplyComplaintInput,
  ComplaintStatus,
  UserRole,
} from '@sadaqahbd/schema';

@Injectable()
export class ComplaintsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async submitComplaint(senderUser: any, input: CreateComplaintInput) {
    const complaintId = crypto.randomUUID();

    // Auto-reply message sent automatically
    const autoReply =
      'ধন্যবাদ। আপনার অভিযোগটি সুপার এডমিনের নিকট সফলভাবে জমা হয়েছে। আমরা শীঘ্রই পর্যালোচনা করে সমাধান বা উত্তর প্রদান করব। (Auto Acknowledgement: Your complaint has been received by Super Admin)';

    await this.db.insert(complaints).values({
      id: complaintId,
      senderId: senderUser.id,
      subject: input.subject,
      message: input.message,
      status: ComplaintStatus.OPEN,
      adminReply: autoReply,
    });

    return {
      success: true,
      message: 'Complaint submitted. An auto-acknowledgement has been registered.',
      complaintId,
    };
  }

  async listComplaints(adminUser: any) {
    if (
      adminUser.role !== UserRole.MASTER_ADMIN &&
      adminUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Super Admin can review complaints');
    }

    const list = await this.db
      .select({
        id: complaints.id,
        senderId: complaints.senderId,
        senderName: users.fullName,
        senderEmail: users.email,
        senderRole: users.role,
        subject: complaints.subject,
        message: complaints.message,
        status: complaints.status,
        adminReply: complaints.adminReply,
        createdAt: complaints.createdAt,
      })
      .from(complaints)
      .innerJoin(users, eq(complaints.senderId, users.id))
      .orderBy(desc(complaints.createdAt));

    return list;
  }

  async replyComplaint(adminUser: any, input: ReplyComplaintInput) {
    if (
      adminUser.role !== UserRole.MASTER_ADMIN &&
      adminUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Super Admin can reply to complaints');
    }

    const existing = await this.db
      .select()
      .from(complaints)
      .where(eq(complaints.id, input.complaintId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('Complaint not found');
    }

    await this.db
      .update(complaints)
      .set({
        adminReply: input.adminReply,
        status: input.status,
        repliedBy: adminUser.id,
        repliedAt: new Date(),
      })
      .where(eq(complaints.id, input.complaintId));

    return {
      success: true,
      message: 'Reply message sent successfully to the complainant',
    };
  }

  async getMyComplaints(senderUser: any) {
    return this.db
      .select()
      .from(complaints)
      .where(eq(complaints.senderId, senderUser.id))
      .orderBy(desc(complaints.createdAt));
  }
}
