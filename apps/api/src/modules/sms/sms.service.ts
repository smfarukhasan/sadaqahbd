import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { DRIZZLE_DB } from '../../database/database.module';
import {
  DrizzleDB,
  users,
  smsBalance,
  smsLogs,
  phoneVerifications,
  userVerifiedPhones,
  studentPhoneExemptions,
  studentProfiles,
  userPermissions,
} from '../../database';
import { eq, and, or, isNull, isNotNull, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  PermissionModuleKey,
  UserRole,
  extract11DigitPhone,
  isValid11DigitPhone,
  formatPhoneForDb,
  formatPhoneForDisplay,
} from '@sadaqahbd/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Format Bangladesh phone numbers into standard 8801XXXXXXXXX format
   */
  normalizePhoneNumber(rawPhone: string): string {
    if (!rawPhone) return '';
    let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+88')) cleaned = cleaned.substring(1);
    if (cleaned.startsWith('880')) return cleaned;
    if (cleaned.startsWith('01')) return '88' + cleaned;
    return cleaned;
  }

  /**
   * Validate Bangladesh 11-digit mobile format
   */
  isValidBangladeshPhone(rawPhone: string): boolean {
    const cleaned = this.normalizePhoneNumber(rawPhone);
    // Must be 8801[3-9]XXXXXXXX (13 digits total)
    return /^8801[3-9]\d{8}$/.test(cleaned);
  }

  /**
   * Check if a phone number is already registered to any other user
   */
  async isPhoneTakenByAnotherUser(phone: string, excludeUserId?: string): Promise<boolean> {
    const rawLocal = extract11DigitPhone(phone); // e.g. 01677373788
    if (!rawLocal) return false;
    const dbFormat = formatPhoneForDb(phone); // e.g. +8801677373788
    const with88 = `88${rawLocal}`; // e.g. 8801677373788

    // 1. Check in users table
    const existingUsers = await this.db
      .select({ id: users.id, phone: users.phone, secondaryPhone: users.secondaryPhone })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          excludeUserId ? sql`${users.id} != ${excludeUserId}` : sql`1=1`,
          or(
            eq(users.phone, rawLocal),
            eq(users.phone, dbFormat),
            eq(users.phone, with88),
            eq(users.secondaryPhone, rawLocal),
            eq(users.secondaryPhone, dbFormat),
            eq(users.secondaryPhone, with88)
          )
        )
      )
      .limit(1);

    if (existingUsers.length > 0) return true;

    // 2. Check in user_verified_phones table
    const existingVerified = await this.db
      .select({ id: userVerifiedPhones.id, userId: userVerifiedPhones.userId })
      .from(userVerifiedPhones)
      .where(
        and(
          excludeUserId ? sql`${userVerifiedPhones.userId} != ${excludeUserId}` : sql`1=1`,
          or(
            eq(userVerifiedPhones.phone, rawLocal),
            eq(userVerifiedPhones.phone, dbFormat),
            eq(userVerifiedPhones.phone, with88)
          )
        )
      )
      .limit(1);

    return existingVerified.length > 0;
  }

  /**
   * Send SMS via mram API
   */
  async sendRawSms(recipientPhone: string, message: string, purpose: string, isSystemAlert = false): Promise<boolean> {
    const normalizedPhone = this.normalizePhoneNumber(recipientPhone);
    if (!normalizedPhone) {
      this.logger.warn(`Cannot send SMS: invalid phone number "${recipientPhone}"`);
      return false;
    }

    const apiUrl = process.env.SMS_API_URL || 'https://sms.mram.com.bd/smsapi';
    const apiKey = process.env.SMS_API_KEY || 'C300188267878f5e7c8567.27892023';
    const rawSender = process.env.SMS_SENDER_ID || 'Khub Soja';
    const senderId = rawSender.replace(/"/g, '');

    try {
      const url = new URL(apiUrl);
      url.searchParams.append('api_key', apiKey);
      url.searchParams.append('type', 'text');
      url.searchParams.append('contacts', normalizedPhone);
      url.searchParams.append('senderid', senderId);
      url.searchParams.append('msg', message);

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });

      const responseText = await res.text();
      const isSuccess = res.ok && !responseText.toLowerCase().includes('error');

      // Record in sms_logs
      await this.db.insert(smsLogs).values({
        id: randomUUID(),
        recipientPhone: normalizedPhone,
        message,
        purpose,
        status: isSuccess ? 'sent' : 'failed',
        gatewayResponse: responseText.slice(0, 1000),
      });

      // If not a system alert and was successful, deduct 1 SMS from sms_balance
      if (!isSystemAlert && isSuccess) {
        await this.db
          .update(smsBalance)
          .set({
            totalUsed: sql`${smsBalance.totalUsed} + 1`,
            remainingSms: sql`GREATEST(0, ${smsBalance.remainingSms} - 1)`,
            updatedAt: new Date(),
          })
          .where(eq(smsBalance.id, 'singleton'));

        // Check if balance has reached warning levels
        await this.checkBalanceAlerts();
      }

      return isSuccess;
    } catch (err: any) {
      this.logger.error(`SMS send failed to ${normalizedPhone}: ${err?.message || err}`);
      try {
        await this.db.insert(smsLogs).values({
          id: randomUUID(),
          recipientPhone: normalizedPhone,
          message,
          purpose,
          status: 'failed',
          gatewayResponse: String(err?.message || err).slice(0, 1000),
        });
      } catch {}
      return false;
    }
  }

  /**
   * Check SMS balance and trigger notifications / English warning SMS
   */
  async checkBalanceAlerts() {
    try {
      const [balance] = await this.db
        .select()
        .from(smsBalance)
        .where(eq(smsBalance.id, 'singleton'))
        .limit(1);

      if (!balance) return;

      const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      // 1. Low Balance Warning (remainingSms <= 10 and > 0)
      if (balance.remainingSms <= 10 && balance.remainingSms > 0) {
        if (balance.lastLowBalanceNotifDate !== todayStr) {
          await this.notificationsService.createNotification({
            recipientRole: 'master_admin',
            titleBn: 'জরুরি সতর্কতা: ওটিপি এসএমএস ব্যালেন্স কমে গেছে',
            titleEn: 'Urgent: Low OTP SMS Balance',
            messageBn: `আপনার সাদাকাহ বিডি সিস্টেমে আর মাত্র ${balance.remainingSms} টি এসএমএস অবশিষ্ট রয়েছে। দ্রুত প্যাকেজ রিচার্জ করুন যাতে ইউজার রেজিস্ট্রেশন ব্যাহত না হয়।`,
            messageEn: `Only ${balance.remainingSms} OTP SMS remaining in Sadaqahbd. Please recharge an SMS package promptly to avoid verification interruptions.`,
            type: 'sms_balance_low',
            requiredPermission: PermissionModuleKey.MAINTENANCE_SMS_PACKAGES,
            link: '/admin?tab=sms_packages',
          });

          await this.db
            .update(smsBalance)
            .set({ lastLowBalanceNotifDate: todayStr })
            .where(eq(smsBalance.id, 'singleton'));
        }
      }

      // 2. Zero Balance Alert (remainingSms === 0)
      if (balance.remainingSms === 0) {
        if (balance.lastZeroBalanceSmsDate !== todayStr) {
          // Send In-App Warning Notification
          await this.notificationsService.createNotification({
            recipientRole: 'master_admin',
            titleBn: 'গুরুতর সতর্কতা: এসএমএস ব্যালেন্স শূন্য (০)',
            titleEn: 'CRITICAL: SMS Balance is Empty (0)',
            messageBn: 'আপনার সাদাকাহ বিডির ইউজারের ফোন নম্বর ভেরিফিকেসনের জন্য OTP পাঠানোর এসএমএস শেষ, জরুরী ভিত্তিতে এসএমএস প্যাকেজ কিনতে হবে, তা না হলে ইউজার ফোন ভেরিফিকেসন করতে পারবে না।',
            messageEn: 'URGENT: Sadaqahbd OTP SMS balance is empty (0 SMS). Users cannot verify phone numbers. Please recharge an SMS package immediately.',
            type: 'sms_balance_zero',
            requiredPermission: PermissionModuleKey.MAINTENANCE_SMS_PACKAGES,
            link: '/admin?tab=sms_packages',
          });

          // Send English Warning SMS to Master Admin & Permitted Super Admins
          await this.sendZeroBalanceWarningSmsToAdmins();

          await this.db
            .update(smsBalance)
            .set({ lastZeroBalanceSmsDate: todayStr })
            .where(eq(smsBalance.id, 'singleton'));
        }
      }
    } catch (err) {
      this.logger.error('checkBalanceAlerts error:', err);
    }
  }

  /**
   * Send English SMS to Master Admin and permitted admins on 0 balance (sent from Khub Soja, free of app quota)
   */
  async sendZeroBalanceWarningSmsToAdmins() {
    try {
      // Find Master Admins
      const masterAdmins = await this.db
        .select({ id: users.id, name: users.fullName, phone: users.phone })
        .from(users)
        .where(and(eq(users.role, UserRole.MASTER_ADMIN), isNull(users.deletedAt)));

      // Find Super Admins with MAINTENANCE_SMS_PACKAGES permission
      const permittedSuperAdmins = await this.db
        .select({ id: users.id, name: users.fullName, phone: users.phone })
        .from(users)
        .innerJoin(userPermissions, eq(userPermissions.userId, users.id))
        .where(
          and(
            eq(users.role, UserRole.SUPER_ADMIN),
            eq(userPermissions.moduleKey, PermissionModuleKey.MAINTENANCE_SMS_PACKAGES),
            eq(userPermissions.canView, true),
            isNull(users.deletedAt)
          )
        );

      const targetAdmins = [...masterAdmins, ...permittedSuperAdmins];
      const seenPhones = new Set<string>();

      const alertMessage =
        'URGENT: Sadaqahbd OTP SMS balance is empty (0 SMS). Users cannot verify phone numbers. Please recharge an SMS package immediately from Apps Privilege/SMS Packages.';

      for (const admin of targetAdmins) {
        if (admin.phone) {
          const norm = this.normalizePhoneNumber(admin.phone);
          if (norm && !seenPhones.has(norm)) {
            seenPhones.add(norm);
            await this.sendRawSms(norm, alertMessage, 'system_zero_sms_alert', true);
          }
        }
      }
    } catch (err) {
      this.logger.error('sendZeroBalanceWarningSmsToAdmins error:', err);
    }
  }

  /**
   * Send OTP for phone verification
   * Note: As per requirement, currently in Demo mode using fixed OTP "123456"
   */
  async sendOtp(userId: string | null, rawPhone: string, isSecondary = false) {
    if (!rawPhone || !isValid11DigitPhone(rawPhone)) {
      throw new BadRequestException('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর প্রদান করুন (যেমন: 01XXXXXXXXX)।');
    }

    const localPhone = extract11DigitPhone(rawPhone);
    const dbPhone = formatPhoneForDb(rawPhone); // +8801XXXXXXXXX

    // Check unique phone rule across platform
    const isTaken = await this.isPhoneTakenByAnotherUser(rawPhone, userId || undefined);
    if (isTaken) {
      throw new BadRequestException('এই ফোন নম্বরটি ইতিমধ্যে অন্য একজন ব্যবহারকারীর একাউন্টে ব্যবহৃত হচ্ছে। অনুগ্রহ করে আপনার নিজস্ব অন্য একটি নম্বর ব্যবহার করুন।');
    }

    // Demo OTP requirement:
    // "আপাতত রিয়েল অটিপি সিস্টেম থাকবে না, আপাতত ডেমো ১২৩৪৫৬ অটিপি দিয়ে কাজ করবো ওইভাবে মডিফাই করে দেও।"
    const otpCode = '123456';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate previous OTPs for this phone
    await this.db
      .delete(phoneVerifications)
      .where(
        and(
          or(
            eq(phoneVerifications.phone, localPhone),
            eq(phoneVerifications.phone, dbPhone)
          ),
          eq(phoneVerifications.isVerified, false)
        )
      );

    // Insert verification row with DB-formatted phone
    const verifId = randomUUID();
    await this.db.insert(phoneVerifications).values({
      id: verifId,
      userId: userId || null,
      phone: dbPhone,
      otpCode,
      expiresAt,
      isVerified: false,
      attempts: 0,
    });

    return {
      success: true,
      message: 'ডেমো ওটিপি কোড: 123456। অনুগ্রহ করে 123456 কোডটি ইনপুট দিয়ে ভেরিফিকেশন সম্পন্ন করুন।',
      phone: localPhone,
      dbPhone,
      expiresAt: expiresAt.toISOString(),
      demoOtp: '123456',
    };
  }

  /**
   * Verify OTP and record verified phone
   * Stored in DB with '+88' prefix (e.g. +8801XXXXXXXXX)
   */
  async verifyOtp(userId: string, rawPhone: string, otpCode: string, isSecondary = false) {
    if (!rawPhone || !otpCode) {
      throw new BadRequestException('ফোন নম্বর এবং ওটিপি কোড উভয়ই প্রদান করা আবশ্যক।');
    }

    if (!isValid11DigitPhone(rawPhone)) {
      throw new BadRequestException('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর প্রদান করুন (যেমন: 01XXXXXXXXX)।');
    }

    const localPhone = extract11DigitPhone(rawPhone);
    const dbPhone = formatPhoneForDb(rawPhone); // +8801XXXXXXXXX
    const cleanOtp = otpCode.trim();
    const isDemoCode = cleanOtp === '123456';

    // Find the latest verification attempt
    const [verif] = await this.db
      .select()
      .from(phoneVerifications)
      .where(
        and(
          or(
            eq(phoneVerifications.phone, dbPhone),
            eq(phoneVerifications.phone, localPhone)
          ),
          eq(phoneVerifications.isVerified, false)
        )
      )
      .orderBy(desc(phoneVerifications.createdAt))
      .limit(1);

    if (!verif && !isDemoCode) {
      throw new BadRequestException('কোনো সক্রিয় ওটিপি কোড পাওয়া যায়নি। অনুগ্রহ করে নতুন ওটিপি চেয়ে চেষ্টা করুন।');
    }

    if (verif) {
      if (new Date() > new Date(verif.expiresAt)) {
        throw new BadRequestException('ওটিপি কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে। অনুগ্রহ করে নতুন কোড চান।');
      }

      if (verif.attempts >= 10) {
        throw new BadRequestException('অতিরিক্ত ভুল ওটিপি চেষ্টার কারণে এই কোডটি বাতিল হয়েছে। নতুন ওটিপি চেয়ে আবার চেষ্টা করুন।');
      }

      if (!isDemoCode && verif.otpCode.trim() !== cleanOtp) {
        await this.db
          .update(phoneVerifications)
          .set({ attempts: sql`${phoneVerifications.attempts} + 1` })
          .where(eq(phoneVerifications.id, verif.id));

        throw new BadRequestException('প্রদত্ত ওটিপি কোডটি সঠিক নয়। (ডেমো কোড: 123456)');
      }

      // Mark verified
      await this.db
        .update(phoneVerifications)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
        })
        .where(eq(phoneVerifications.id, verif.id));
    }

    // Check again unique rule
    const isTaken = await this.isPhoneTakenByAnotherUser(rawPhone, userId);
    if (isTaken) {
      throw new BadRequestException('এই ফোন নম্বরটি ইতিমধ্যে অন্য একটি একাউন্টে নিবন্ধিত রয়েছে।');
    }

    // Check existing verified phones count for this user
    const existingPhones = await this.db
      .select()
      .from(userVerifiedPhones)
      .where(eq(userVerifiedPhones.userId, userId));

    if (existingPhones.length >= 2) {
      throw new BadRequestException('একজন ব্যবহারকারী সর্বোচ্চ ২টি ভেরিফাইড নম্বর যুক্ত করতে পারেন।');
    }

    const isPrimary = !isSecondary && existingPhones.length === 0;

    // Check if phone already in user_verified_phones (check both formats)
    const alreadyInList = existingPhones.some((p) => p.phone === dbPhone || p.phone === localPhone);
    if (!alreadyInList) {
      await this.db.insert(userVerifiedPhones).values({
        id: randomUUID(),
        userId,
        phone: dbPhone,
        isPrimary,
        verifiedAt: new Date(),
      });
    }

    // Update user record: always store in DB with +88 prefix!
    if (isSecondary) {
      await this.db
        .update(users)
        .set({
          secondaryPhone: dbPhone,
          isSecondaryPhoneVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      await this.db
        .update(users)
        .set({
          phone: dbPhone,
          isPhoneVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return {
      success: true,
      message: 'ফোন নম্বরটি সফলভাবে ভেরিফাই করা হয়েছে।',
      phone: dbPhone,
      displayPhone: localPhone,
      isPrimary,
    };
  }

  /**
   * Get all verified phone numbers of a user
   */
  async getUserVerifiedPhones(userId: string) {
    const records = await this.db
      .select()
      .from(userVerifiedPhones)
      .where(eq(userVerifiedPhones.userId, userId));

    // If records are empty but user has phone verified in users table, backfill it
    if (records.length === 0) {
      const [u] = await this.db
        .select({ phone: users.phone, isPhoneVerified: users.isPhoneVerified })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (u?.phone && u.isPhoneVerified) {
        const id = randomUUID();
        await this.db.insert(userVerifiedPhones).values({
          id,
          userId,
          phone: u.phone,
          isPrimary: true,
          verifiedAt: new Date(),
        });
        return [{ id, userId, phone: u.phone, isPrimary: true, verifiedAt: new Date() }];
      }
    }

    return records;
  }

  /**
   * Remove a verified phone number
   * Rule: Must have 2 verified numbers to remove one.
   */
  async removeVerifiedPhone(userId: string, rawPhone: string) {
    const localPhone = rawPhone.replace(/[^\d]/g, '').replace(/^88/, '');

    const verifiedList = await this.db
      .select()
      .from(userVerifiedPhones)
      .where(eq(userVerifiedPhones.userId, userId));

    if (verifiedList.length <= 1) {
      throw new BadRequestException(
        'আপনার একাউন্টে শুধুমাত্র একটি ভেরিফায়েড নম্বর রয়েছে। নতুন আরেকটি নম্বর ভেরিফাই করে যুক্ত না করা পর্যন্ত বর্তমান নম্বর রিমুভ করা সম্ভব নয়।'
      );
    }

    const target = verifiedList.find((p) => p.phone === localPhone);
    if (!target) {
      throw new NotFoundException('উল্লেখিত ফোন নম্বরটি আপনার ভেরিফাইড তালিকায় পাওয়া যায়নি।');
    }

    // Delete target phone from user_verified_phones
    await this.db
      .delete(userVerifiedPhones)
      .where(and(eq(userVerifiedPhones.userId, userId), eq(userVerifiedPhones.phone, localPhone)));

    // Get the remaining phone
    const remaining = verifiedList.find((p) => p.phone !== localPhone);

    if (remaining) {
      // Set remaining phone as primary
      await this.db
        .update(userVerifiedPhones)
        .set({ isPrimary: true })
        .where(eq(userVerifiedPhones.id, remaining.id));

      // Update user record: primary is remaining, secondary is cleared
      await this.db
        .update(users)
        .set({
          phone: remaining.phone,
          isPhoneVerified: true,
          secondaryPhone: null,
          isSecondaryPhoneVerified: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return {
      success: true,
      message: 'ফোন নম্বরটি সফলভাবে রিমুভ করা হয়েছে। অবশিষ্ট নম্বরটি প্রাথমিক নম্বর হিসেবে সক্রিয় আছে।',
    };
  }

  /**
   * Student Phone Exemption Application
   */
  async applyStudentExemption(studentId: string, reason: string) {
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('অনুগ্রহ করে ফোন নম্বর না থাকার বিস্তারিত কারণ উল্লেখ করুন (কমপক্ষে ১০ অক্ষর)।');
    }

    const [student] = await this.db
      .select({ id: users.id, role: users.role, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student || student.role !== UserRole.STUDENT) {
      throw new ForbiddenException('শুধুমাত্র শিক্ষার্থীরা ফোন নম্বর অব্যাহতির জন্য আবেদন করতে পারেন।');
    }

    // Check if there is an existing pending request
    const [pending] = await this.db
      .select()
      .from(studentPhoneExemptions)
      .where(
        and(
          eq(studentPhoneExemptions.studentId, studentId),
          eq(studentPhoneExemptions.status, 'pending')
        )
      )
      .limit(1);

    if (pending) {
      throw new BadRequestException('আপনার পূর্বের একটি আবেদন বর্তমানে পর্যালোচনায় রয়েছে। অনুগ্রহ করে এডমিনের সিদ্ধান্তের জন্য অপেক্ষা করুন।');
    }

    const exemptionId = randomUUID();
    await this.db.insert(studentPhoneExemptions).values({
      id: exemptionId,
      studentId,
      reason: reason.trim(),
      status: 'pending',
    });

    // Notify Master Admin & Permitted Admins
    await this.notificationsService.createNotification({
      recipientRole: 'master_admin',
      titleBn: 'নতুন শিক্ষার্থী ফোন অব্যাহতি আবেদন',
      titleEn: 'Student Phone Exemption Request',
      messageBn: `শিক্ষার্থী ${student.fullName} ফোন নম্বর না থাকার কারণে একাউন্ট ব্যবহারের বিশেষ অব্যাহতি আবেদন জমা দিয়েছেন।`,
      messageEn: `Student ${student.fullName} requested phone verification exemption due to lack of a personal phone.`,
      type: 'student_phone_exemption_submitted',
      requiredPermission: PermissionModuleKey.STUDENT_PHONE_EXEMPTIONS,
      link: '/admin?tab=phone_exemptions',
    });

    return {
      success: true,
      message: 'আপনার ফোন নম্বর অব্যাহতির আবেদন সফলভাবে জমা হয়েছে। এডমিন প্যানেল থেকে পর্যালোচনা করে অনুমোদন দেওয়া হবে।',
      id: exemptionId,
    };
  }

  /**
   * Get Student's Exemption Requests & Current Exemption Status
   */
  async getStudentExemptionStatus(studentId: string) {
    const requests = await this.db
      .select()
      .from(studentPhoneExemptions)
      .where(eq(studentPhoneExemptions.studentId, studentId))
      .orderBy(desc(studentPhoneExemptions.createdAt));

    const [userRow] = await this.db
      .select({
        isPhoneVerified: users.isPhoneVerified,
        phoneExemptionValidUntil: users.phoneExemptionValidUntil,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    const now = new Date();
    const validUntilDate = userRow?.phoneExemptionValidUntil
      ? new Date(userRow.phoneExemptionValidUntil)
      : null;
    const isExemptActive = validUntilDate ? validUntilDate > now : false;

    return {
      isPhoneVerified: Boolean(userRow?.isPhoneVerified),
      isExemptActive,
      phoneExemptionValidUntil: userRow?.phoneExemptionValidUntil || null,
      latestRequest: requests[0] || null,
      history: requests,
    };
  }

  /**
   * Helper to verify if an admin user has permission to manage student exemptions / verifications
   */
  async canAdminManageExemptions(adminUser: any): Promise<boolean> {
    if (!adminUser) return false;
    if (adminUser.role === UserRole.MASTER_ADMIN) return true;
    if (adminUser.role === UserRole.SUPER_ADMIN || adminUser.role === UserRole.ADMIN) {
      const [perm] = await this.db
        .select()
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, adminUser.id),
            or(
              eq(userPermissions.moduleKey, PermissionModuleKey.STUDENT_PHONE_EXEMPTIONS),
              eq(userPermissions.moduleKey, PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS)
            )
          )
        )
        .limit(1);
      return Boolean(perm?.canView || perm?.canEdit || perm?.canApprove);
    }
    return false;
  }

  /**
   * List all student information verification & exemption requests for Admin audit
   * Master Admin and permitted Super Admins / Admins
   */
  async listAllStudentExemptions(adminUser?: any) {
    if (adminUser) {
      const allowed = await this.canAdminManageExemptions(adminUser);
      if (!allowed) {
        throw new ForbiddenException('আপনার এই সেকশনে প্রবেশের অনুমোদন নেই।');
      }
    }

    const rows = await this.db
      .select({
        id: sql<string>`COALESCE(${studentPhoneExemptions.id}, ${studentProfiles.id}, ${users.id})`,
        exemptionId: studentPhoneExemptions.id,
        profileId: studentProfiles.id,
        studentId: users.id,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        studentAddress: users.address,
        studentStatus: users.status,
        isPhoneVerified: users.isPhoneVerified,
        phoneExemptionValidUntil: users.phoneExemptionValidUntil,
        // Exemption data
        reason: studentPhoneExemptions.reason,
        status: sql<string>`COALESCE(${studentPhoneExemptions.status}, CASE WHEN ${studentProfiles.verificationStatus} = 'verified' THEN 'approved' WHEN ${studentProfiles.verificationStatus} = 'rejected' THEN 'rejected' ELSE 'pending' END)`,
        validUntil: studentPhoneExemptions.validUntil,
        reviewedBy: sql<string>`COALESCE(${studentPhoneExemptions.reviewedBy}, ${studentProfiles.adminApprovedBy})`,
        reviewedAt: sql<Date>`COALESCE(${studentPhoneExemptions.reviewedAt}, ${studentProfiles.adminApprovedAt})`,
        rejectionReason: sql<string>`COALESCE(${studentPhoneExemptions.rejectionReason}, ${studentProfiles.rejectionReason})`,
        createdAt: sql<Date>`COALESCE(${studentPhoneExemptions.createdAt}, ${studentProfiles.createdAt}, ${users.createdAt})`,
        updatedAt: sql<Date>`COALESCE(${studentPhoneExemptions.updatedAt}, ${studentProfiles.createdAt}, ${users.updatedAt})`,
        // Profile data
        fatherName: studentProfiles.fatherName,
        dateOfBirth: studentProfiles.dateOfBirth,
        bloodGroup: studentProfiles.bloodGroup,
        nidOrBirthCertificateNumber: studentProfiles.nidOrBirthCertificateNumber,
        presentAddress: studentProfiles.presentAddress,
        permanentAddress: studentProfiles.permanentAddress,
        guardianName: studentProfiles.guardianName,
        guardianRelationship: studentProfiles.guardianRelationship,
        guardianPhone: studentProfiles.guardianPhone,
        guardianAddress: studentProfiles.guardianAddress,
        verificationStatus: studentProfiles.verificationStatus,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(studentPhoneExemptions, eq(studentPhoneExemptions.studentId, users.id))
      .where(
        and(
          eq(users.role, UserRole.STUDENT),
          isNull(users.deletedAt),
          or(
            isNotNull(studentPhoneExemptions.id),
            isNotNull(studentProfiles.id)
          )
        )
      )
      .orderBy(desc(users.createdAt));

    return rows;
  }

  /**
   * Review Student Verification / Exemption Request (Accept with Date Picker or Reject with Reason)
   * Accessible to Master Admin and Super Admins / Admins with STUDENT_PHONE_EXEMPTIONS permission
   */
  async reviewStudentExemption(
    adminUser: any,
    exemptionId: string,
    action: 'approve' | 'reject',
    validUntil?: string,
    rejectionReason?: string
  ) {
    const allowed = await this.canAdminManageExemptions(adminUser);
    if (!allowed) {
      throw new ForbiddenException('আপনার শিক্ষার্থী তথ্য ভেরিফিকেশন অনুমোদন বা বাতিলের অনুমতি নেই।');
    }

    let exemption: any = null;
    let targetStudentId = '';

    const [exemptionRow] = await this.db
      .select()
      .from(studentPhoneExemptions)
      .where(eq(studentPhoneExemptions.id, exemptionId))
      .limit(1);

    if (exemptionRow) {
      exemption = exemptionRow;
      targetStudentId = exemptionRow.studentId;
    } else {
      const [byUserId] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, exemptionId))
        .limit(1);

      if (byUserId) {
        targetStudentId = byUserId.id;
      } else {
        const [byProf] = await this.db
          .select({ userId: studentProfiles.userId })
          .from(studentProfiles)
          .where(eq(studentProfiles.id, exemptionId))
          .limit(1);
        if (byProf) {
          targetStudentId = byProf.userId;
        }
      }
    }

    if (!targetStudentId) {
      throw new NotFoundException('শিক্ষার্থীর আবেদনটি পাওয়া যায়নি।');
    }

    if (action === 'approve') {
      let validUntilDate: Date | null = null;
      if (validUntil) {
        validUntilDate = new Date(validUntil);
        if (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
          throw new BadRequestException('অব্যাহতির শেষ তারিখ অবশ্যই ভবিষ্যতের কোনো তারিখ হতে হবে।');
        }
      }

      if (exemption) {
        if (!validUntilDate) {
          const d = new Date();
          d.setMonth(d.getMonth() + 3);
          validUntilDate = d;
        }
        await this.db
          .update(studentPhoneExemptions)
          .set({
            status: 'approved',
            validUntil: validUntilDate,
            reviewedBy: adminUser.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(studentPhoneExemptions.id, exemption.id));
      }

      const userUpdates: any = {
        status: 'active',
        updatedAt: new Date(),
      };
      if (validUntilDate) {
        userUpdates.phoneExemptionValidUntil = validUntilDate;
      }
      await this.db.update(users).set(userUpdates).where(eq(users.id, targetStudentId));

      await this.db
        .update(studentProfiles)
        .set({
          verificationStatus: 'verified',
          adminApprovedBy: adminUser.id,
          adminApprovedAt: new Date(),
        })
        .where(eq(studentProfiles.userId, targetStudentId));

      await this.notificationsService.createNotification({
        recipientUserId: targetStudentId,
        titleBn: 'শিক্ষার্থীর তথ্য ভেরিফিকেশন সফল',
        titleEn: 'Student Information Verified',
        messageBn: 'আপনার শিক্ষার্থীর তথ্য সফলভাবে অনুমোদন করা হয়েছে। আপনি এখন প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন করতে পারবেন।',
        messageEn: 'Your student information has been successfully approved by the administration.',
        type: 'student_verification_approved',
      });

      return {
        success: true,
        message: 'শিক্ষার্থীর তথ্য ও ভেরিফিকেশন সফলভাবে অনুমোদন করা হয়েছে।',
      };
    } else {
      if (!rejectionReason || rejectionReason.trim().length < 5) {
        throw new BadRequestException('আবেদন রিজেক্ট করার কারণ বিস্তারিত উল্লেখ করুন (কমপক্ষে ৫ অক্ষর)।');
      }

      if (exemption) {
        await this.db
          .update(studentPhoneExemptions)
          .set({
            status: 'rejected',
            rejectionReason: rejectionReason.trim(),
            reviewedBy: adminUser.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(studentPhoneExemptions.id, exemption.id));
      }

      await this.db
        .update(studentProfiles)
        .set({
          verificationStatus: 'rejected',
          rejectionReason: rejectionReason.trim(),
        })
        .where(eq(studentProfiles.userId, targetStudentId));

      await this.notificationsService.createNotification({
        recipientUserId: targetStudentId,
        titleBn: 'শিক্ষার্থীর তথ্য ভেরিফিকেশন প্রত্যাখ্যাত',
        titleEn: 'Student Information Verification Rejected',
        messageBn: `আপনার তথ্য ভেরিফিকেশনের আবেদনটি গৃহীত হয়নি। কারণ: "${rejectionReason.trim()}". অনুগ্রহ করে তথ্য সংশোধন করে পুনরায় আবেদন করুন।`,
        messageEn: `Your student information verification was rejected. Reason: ${rejectionReason.trim()}`,
        type: 'student_verification_rejected',
      });

      return {
        success: true,
        message: 'আবেদনটি বাতিল করা হয়েছে এবং শিক্ষার্থীকে কারণ সহ অবহিত করা হয়েছে।',
      };
    }
  }
}
