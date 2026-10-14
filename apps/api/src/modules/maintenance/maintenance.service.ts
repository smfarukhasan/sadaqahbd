import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { DRIZZLE_DB } from '../../database/database.module';
import {
  DrizzleDB,
  appMaintenanceSettings,
  appMaintenancePayments,
  smsBalance,
  smsPackagePurchases,
  users,
  userPermissions,
} from '../../database';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { PermissionModuleKey, UserRole } from '@sadaqahbd/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';

export interface SmsPackageItem {
  id: string;
  name: string;
  smsCount: number;
  amount: number;
}

export const SMS_PACKAGES: SmsPackageItem[] = [
  // Standard packages (50 paisa per SMS)
  { id: 'pkg-200', name: '200 SMS', smsCount: 200, amount: 100 },
  { id: 'pkg-500', name: '500 SMS', smsCount: 500, amount: 250 },
  { id: 'pkg-1000', name: '1000 SMS', smsCount: 1000, amount: 500 },
  { id: 'pkg-2500', name: '2500 SMS', smsCount: 2500, amount: 1250 },
  // Small packages
  { id: 'pkg-20', name: '20 SMS', smsCount: 20, amount: 12 },
  { id: 'pkg-50', name: '50 SMS', smsCount: 50, amount: 29 },
  { id: 'pkg-100', name: '100 SMS', smsCount: 100, amount: 55 },
  { id: 'pkg-150', name: '150 SMS', smsCount: 150, amount: 83 },
];

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService,
    private readonly smsService: SmsService
  ) {}

  // ====================================================
  // 1. APPS PRIVILEGE & MAINTENANCE SUBSCRIPTION
  // ====================================================

  /**
   * Get current Apps Privilege status, prices, and recent payments
   */
  async getAppsPrivilegeStatus() {
    let [settings] = await this.db
      .select()
      .from(appMaintenanceSettings)
      .where(eq(appMaintenanceSettings.id, 'singleton'))
      .limit(1);

    if (!settings) {
      const defaultDate = new Date('2027-09-01T00:00:00Z');
      await this.db.insert(appMaintenanceSettings).values({
        id: 'singleton',
        currentValidUntil: defaultDate,
        monthlyPrice: '500.00',
        yearlyPrice: '5000.00',
        regularMonthlyPrice: '1000.00',
        regularYearlyPrice: '10000.00',
      });
      [settings] = await this.db
        .select()
        .from(appMaintenanceSettings)
        .where(eq(appMaintenanceSettings.id, 'singleton'))
        .limit(1);
    }

    const now = new Date();
    const validUntilDate = new Date(settings.currentValidUntil);
    const diffMs = validUntilDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs <= 0;

    const payments = await this.db
      .select()
      .from(appMaintenancePayments)
      .orderBy(desc(appMaintenancePayments.createdAt))
      .limit(50);

    return {
      currentValidUntil: settings.currentValidUntil,
      daysRemaining,
      isExpired,
      monthlyPrice: Number(settings.monthlyPrice),
      yearlyPrice: Number(settings.yearlyPrice),
      regularMonthlyPrice: Number(settings.regularMonthlyPrice),
      regularYearlyPrice: Number(settings.regularYearlyPrice),
      payments,
    };
  }

  /**
   * Create Checkout Session via Khub Soja Payment Gateway (https://pay.khubsoja.com)
   */
  async createAppsPrivilegePaymentSession(
    user: any,
    planType: 'monthly' | 'yearly',
    returnUrl: string,
    cancelUrl?: string
  ) {
    const status = await this.getAppsPrivilegeStatus();
    const amount = planType === 'yearly' ? status.yearlyPrice : status.monthlyPrice;
    const orderId = `ORD-MP-${Date.now()}`;

    try {
      const payload = {
        app_name: 'Sadaqahbd Maintenance',
        amount: Number(amount),
        order_id: orderId,
        customer_name: user?.name || 'Master Admin',
        customer_phone: user?.phone || '',
        customer_email: user?.email || 'admin@sadaqahbd.com',
        return_url: returnUrl,
        cancel_url: cancelUrl || returnUrl,
      };

      const res = await fetch('https://pay.khubsoja.com/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'SUCCESS') {
        throw new BadRequestException(data.message || 'পেমেন্ট সেশন তৈরি করতে সমস্যা হয়েছে।');
      }

      // Record in app_maintenance_payments as pending
      const paymentId = randomUUID();
      await this.db.insert(appMaintenancePayments).values({
        id: paymentId,
        planType,
        amount: String(amount),
        transactionId: data.transaction_id,
        orderId: data.order_id || orderId,
        gatewayProvider: 'khubsoja',
        status: 'pending',
        paidByUserId: user?.id || null,
        paidByName: user?.name || null,
        paidByEmail: user?.email || null,
      });

      return {
        checkoutUrl: data.checkout_url,
        transactionId: data.transaction_id,
        orderId: data.order_id || orderId,
      };
    } catch (err: any) {
      this.logger.error('createAppsPrivilegePaymentSession error:', err);
      throw new BadRequestException(err?.message || 'পেমেন্ট গেটওয়েতে সংযোগ করা যায়নি।');
    }
  }

  /**
   * Verify Apps Privilege Payment & Extend Subscription Validity (+1 month / +1 year)
   */
  async verifyAppsPrivilegePayment(transactionId: string) {
    if (!transactionId) {
      throw new BadRequestException('ট্রানজেকশন আইডি আবশ্যক।');
    }

    try {
      const res = await fetch(`https://pay.khubsoja.com/api/payment/verify/${encodeURIComponent(transactionId)}`);
      const result = await res.json();

      if (!res.ok || result.status !== 'SUCCESS' || !result.data) {
        throw new BadRequestException(result.message || 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে।');
      }

      const gatewayData = result.data;
      if (gatewayData.status !== 'SUCCESS') {
        return {
          status: gatewayData.status,
          message: 'পেমেন্ট এখনও সম্পন্ন হয়নি বা পর্যালোচনায় রয়েছে।',
          data: gatewayData,
        };
      }

      // Find the local payment record
      const [payment] = await this.db
        .select()
        .from(appMaintenancePayments)
        .where(eq(appMaintenancePayments.transactionId, transactionId))
        .limit(1);

      if (!payment) {
        throw new NotFoundException('পেমেন্ট রেকর্ড পাওয়া যায়নি।');
      }

      // If already marked success, return immediately
      if (payment.status === 'success') {
        return {
          status: 'SUCCESS',
          alreadyProcessed: true,
          payment,
        };
      }

      // Calculate new validity
      const [settings] = await this.db
        .select()
        .from(appMaintenanceSettings)
        .where(eq(appMaintenanceSettings.id, 'singleton'))
        .limit(1);

      const now = new Date();
      const currentValidUntil = settings?.currentValidUntil ? new Date(settings.currentValidUntil) : now;
      const baseDate = currentValidUntil > now ? new Date(currentValidUntil) : new Date(now);

      const extendedDate = new Date(baseDate);
      if (payment.planType === 'yearly') {
        extendedDate.setFullYear(extendedDate.getFullYear() + 1);
      } else {
        extendedDate.setMonth(extendedDate.getMonth() + 1);
      }

      // Update payment record
      await this.db
        .update(appMaintenancePayments)
        .set({
          status: 'success',
          paidAt: new Date(),
          previousValidUntil: currentValidUntil,
          extendedValidUntil: extendedDate,
        })
        .where(eq(appMaintenancePayments.id, payment.id));

      // Update maintenance settings
      await this.db
        .update(appMaintenanceSettings)
        .set({
          currentValidUntil: extendedDate,
          updatedAt: new Date(),
        })
        .where(eq(appMaintenanceSettings.id, 'singleton'));

      // Send confirmation notification to Master Admin & Permitted Admins
      const dateFormatted = extendedDate.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      await this.notificationsService.createNotification({
        recipientRole: 'master_admin',
        titleBn: 'অ্যাপস প্রিভিলেজ রিনিউয়াল সফল',
        titleEn: 'Apps Privilege Renewal Successful',
        messageBn: `খুব সোজা গেটওয়ের মাধ্যমে ৳${payment.amount} (${payment.planType === 'yearly' ? 'বাৎসরিক' : 'মাসিক'}) পেমেন্ট সফল হয়েছে। আপনার অ্যাপের পরবর্তী মেয়াদ: ${dateFormatted} পর্যন্ত বাড়ানো হয়েছে।`,
        messageEn: `Apps Privilege renewed successfully via Khub Soja for ৳${payment.amount}. New validity: ${extendedDate.toISOString().slice(0, 10)}.`,
        type: 'maintenance_renewed',
        requiredPermission: PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE,
        link: '/admin?tab=apps_privilege',
      });

      return {
        status: 'SUCCESS',
        message: 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং সাবস্ক্রিপশন মেয়াদ বৃদ্ধি করা হয়েছে।',
        extendedValidUntil: extendedDate,
      };
    } catch (err: any) {
      this.logger.error('verifyAppsPrivilegePayment error:', err);
      throw new BadRequestException(err?.message || 'পেমেন্ট ভেরিফিকেশন সম্পন্ন করা যায়নি।');
    }
  }

  /**
   * Check Apps Privilege expiration and schedule warning notifications & warning SMS
   */
  async checkAppsPrivilegeAlerts() {
    try {
      const [settings] = await this.db
        .select()
        .from(appMaintenanceSettings)
        .where(eq(appMaintenanceSettings.id, 'singleton'))
        .limit(1);

      if (!settings) return;

      const now = new Date();
      const validUntil = new Date(settings.currentValidUntil);
      const diffMs = validUntil.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const todayStr = now.toISOString().slice(0, 10);

      // Rule: For Yearly plan, notifications on 01/08, 10/08, and daily from 25/08 to 01/09:
      // "সঠিক সময়ে পেমেন্ট না করার জন্য আপনার এই অ্যাপের সকল ডাটা রিমুভ হয়ে যাবে, তাই নিরাপদ থাকতে অনুগ্রহ করে দ্রুত পেমেন্ট করুন।"
      // Dynamically relative to validUntil:
      // ~31 days before (01/08 equivalent: diffDays === 31),
      // ~22 days before (10/08 equivalent: diffDays === 22),
      // and last 7 days daily (diffDays <= 7 && diffDays > 0)
      const shouldSendWarningNotif =
        diffDays === 31 || diffDays === 22 || (diffDays <= 7 && diffDays > 0);

      if (shouldSendWarningNotif && settings.lastWarningNotifDate !== todayStr) {
        await this.notificationsService.createNotification({
          recipientRole: 'master_admin',
          titleBn: 'জরুরি রিনিউয়াল সতর্কতা: অ্যাপ সাবস্ক্রিপশন মেয়াদ',
          titleEn: 'Urgent: App Maintenance Renewal Due',
          messageBn: 'সঠিক সময়ে পেমেন্ট না করার জন্য আপনার এই অ্যাপের সকল ডাটা রিমুভ হয়ে যাবে, তাই নিরাপদ থাকতে অনুগ্রহ করে দ্রুত পেমেন্ট করুন।',
          messageEn: 'To prevent permanent loss and removal of all application data, please renew your subscription promptly.',
          type: 'maintenance_renewal_due',
          requiredPermission: PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE,
          link: '/admin?tab=apps_privilege',
        });

        await this.db
          .update(appMaintenanceSettings)
          .set({ lastWarningNotifDate: todayStr })
          .where(eq(appMaintenanceSettings.id, 'singleton'));
      }

      // Rule: If expiration date arrives or passes without payment, send warning English SMS to permitted admins
      if (diffDays <= 0 && settings.lastWarningSmsDate !== todayStr) {
        await this.sendAppsPrivilegeExpiredSmsToAdmins();

        await this.db
          .update(appMaintenanceSettings)
          .set({ lastWarningSmsDate: todayStr })
          .where(eq(appMaintenanceSettings.id, 'singleton'));
      }
    } catch (err) {
      this.logger.error('checkAppsPrivilegeAlerts error:', err);
    }
  }

  /**
   * Send English SMS to Master Admin & permitted Super Admins on subscription expiration
   */
  async sendAppsPrivilegeExpiredSmsToAdmins() {
    try {
      const masterAdmins = await this.db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .where(and(eq(users.role, UserRole.MASTER_ADMIN), isNull(users.deletedAt)));

      const permittedSuperAdmins = await this.db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .innerJoin(userPermissions, eq(userPermissions.userId, users.id))
        .where(
          and(
            eq(users.role, UserRole.SUPER_ADMIN),
            eq(userPermissions.moduleKey, PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE),
            eq(userPermissions.canView, true),
            isNull(users.deletedAt)
          )
        );

      const targetAdmins = [...masterAdmins, ...permittedSuperAdmins];
      const seenPhones = new Set<string>();

      const alertMessage =
        'URGENT: Your Sadaqahbd app maintenance subscription has expired. Please renew immediately via Apps Privilege to avoid permanent data removal.';

      for (const admin of targetAdmins) {
        if (admin.phone) {
          const norm = this.smsService.normalizePhoneNumber(admin.phone);
          if (norm && !seenPhones.has(norm)) {
            seenPhones.add(norm);
            await this.smsService.sendRawSms(norm, alertMessage, 'apps_privilege_expired_alert', true);
          }
        }
      }
    } catch (err) {
      this.logger.error('sendAppsPrivilegeExpiredSmsToAdmins error:', err);
    }
  }

  // ====================================================
  // 2. SMS PACKAGES & METER
  // ====================================================

  /**
   * Get SMS balance meter (Total Credited, Total Used, Remaining SMS)
   */
  async getSmsMeter() {
    let [balance] = await this.db
      .select()
      .from(smsBalance)
      .where(eq(smsBalance.id, 'singleton'))
      .limit(1);

    if (!balance) {
      await this.db.insert(smsBalance).values({
        id: 'singleton',
        totalCredited: 100,
        totalUsed: 0,
        remainingSms: 100,
      });
      [balance] = await this.db
        .select()
        .from(smsBalance)
        .where(eq(smsBalance.id, 'singleton'))
        .limit(1);
    }

    return {
      totalCredited: balance.totalCredited,
      totalUsed: balance.totalUsed,
      remainingSms: balance.remainingSms,
      updatedAt: balance.updatedAt,
    };
  }

  /**
   * Get predefined SMS packages
   */
  getSmsPackages() {
    return SMS_PACKAGES;
  }

  /**
   * Buy SMS Package via Khub Soja Payment Gateway
   */
  async buySmsPackage(
    user: any,
    packageId: string,
    returnUrl: string,
    cancelUrl?: string
  ) {
    const pkg = SMS_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw new BadRequestException('অনুগ্রহ করে একটি সঠিক এসএমএস প্যাকেজ নির্বাচন করুন।');
    }

    const orderId = `ORD-SMS-${Date.now()}`;

    try {
      const payload = {
        app_name: 'Sadaqahbd SMS Package',
        amount: Number(pkg.amount),
        order_id: orderId,
        customer_name: user?.name || 'Master Admin',
        customer_phone: user?.phone || '',
        customer_email: user?.email || 'admin@sadaqahbd.com',
        return_url: returnUrl,
        cancel_url: cancelUrl || returnUrl,
      };

      const res = await fetch('https://pay.khubsoja.com/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'SUCCESS') {
        throw new BadRequestException(data.message || 'পেমেন্ট সেশন তৈরি করতে সমস্যা হয়েছে।');
      }

      // Record in sms_package_purchases as pending
      const purchaseId = randomUUID();
      await this.db.insert(smsPackagePurchases).values({
        id: purchaseId,
        packageName: pkg.name,
        smsCount: pkg.smsCount,
        amount: String(pkg.amount),
        transactionId: data.transaction_id,
        orderId: data.order_id || orderId,
        status: 'pending',
        purchasedByUserId: user?.id || null,
      });

      return {
        checkoutUrl: data.checkout_url,
        transactionId: data.transaction_id,
        orderId: data.order_id || orderId,
      };
    } catch (err: any) {
      this.logger.error('buySmsPackage error:', err);
      throw new BadRequestException(err?.message || 'পেমেন্ট গেটওয়েতে সংযোগ করা যায়নি।');
    }
  }

  /**
   * Verify SMS Package Purchase & Credit SMS to Balance Meter
   */
  async verifySmsPurchase(transactionId: string) {
    if (!transactionId) {
      throw new BadRequestException('ট্রানজেকশন আইডি আবশ্যক।');
    }

    try {
      const res = await fetch(`https://pay.khubsoja.com/api/payment/verify/${encodeURIComponent(transactionId)}`);
      const result = await res.json();

      if (!res.ok || result.status !== 'SUCCESS' || !result.data) {
        throw new BadRequestException(result.message || 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে।');
      }

      const gatewayData = result.data;
      if (gatewayData.status !== 'SUCCESS') {
        return {
          status: gatewayData.status,
          message: 'পেমেন্ট এখনও সম্পন্ন হয়নি বা পর্যালোচনায় রয়েছে।',
          data: gatewayData,
        };
      }

      // Find local purchase record
      const [purchase] = await this.db
        .select()
        .from(smsPackagePurchases)
        .where(eq(smsPackagePurchases.transactionId, transactionId))
        .limit(1);

      if (!purchase) {
        throw new NotFoundException('প্যাকেজ ক্রয়ের রেকর্ড পাওয়া যায়নি।');
      }

      if (purchase.status === 'success') {
        return {
          status: 'SUCCESS',
          alreadyProcessed: true,
          purchase,
        };
      }

      // Update purchase record
      await this.db
        .update(smsPackagePurchases)
        .set({
          status: 'success',
          purchasedAt: new Date(),
        })
        .where(eq(smsPackagePurchases.id, purchase.id));

      // Credit SMS to sms_balance
      await this.db
        .update(smsBalance)
        .set({
          totalCredited: sql`${smsBalance.totalCredited} + ${purchase.smsCount}`,
          remainingSms: sql`${smsBalance.remainingSms} + ${purchase.smsCount}`,
          updatedAt: new Date(),
        })
        .where(eq(smsBalance.id, 'singleton'));

      // Send confirmation notification
      await this.notificationsService.createNotification({
        recipientRole: 'master_admin',
        titleBn: 'এসএমএস প্যাকেজ রিচার্জ সফল',
        titleEn: 'SMS Package Recharge Successful',
        messageBn: `খুব সোজা গেটওয়ের মাধ্যমে ৳${purchase.amount} মূল্যের ${purchase.packageName} সফলভাবে কেনা হয়েছে। আপনার মিটারে ${purchase.smsCount} টি এসএমএস ক্রেডিট করা হয়েছে।`,
        messageEn: `Purchased ${purchase.packageName} (${purchase.smsCount} SMS) for ৳${purchase.amount}.`,
        type: 'sms_package_purchased',
        requiredPermission: PermissionModuleKey.MAINTENANCE_SMS_PACKAGES,
        link: '/admin?tab=sms_packages',
      });

      return {
        status: 'SUCCESS',
        message: `পেমেন্ট সফল হয়েছে এবং ${purchase.smsCount} টি এসএমএস আপনার মিটারে যুক্ত করা হয়েছে।`,
        purchase,
      };
    } catch (err: any) {
      this.logger.error('verifySmsPurchase error:', err);
      throw new BadRequestException(err?.message || 'এসএমএস প্যাকেজ ভেরিফিকেশন সম্পন্ন করা যায়নি।');
    }
  }

  /**
   * Get purchase history of SMS packages
   */
  async getSmsPurchaseHistory() {
    return await this.db
      .select()
      .from(smsPackagePurchases)
      .orderBy(desc(smsPackagePurchases.createdAt));
  }
}
