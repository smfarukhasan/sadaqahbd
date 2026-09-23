import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../database/database.module';
import { DrizzleDB, users, userPermissions, studentProfiles } from '../../database';
import { FirebaseAdminService } from './firebase-admin.service';
import { eq, ne, and, isNull } from 'drizzle-orm';
import {
  RegisterUserInput,
  SetPasswordInput,
  ChangePasswordInput,
  UserRole,
} from '@sadaqahbd/schema';
import { signMasterToken } from './master-token.util';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  async checkAvailability(email?: string, phone?: string) {
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === 'admin@sadaqahbd.com' || normalizedEmail === 'admin@sadaqahbd.co') {
        return {
          available: false,
          field: 'email',
          message: 'admin@sadaqahbd.com শুধুমাত্র মাস্টার এডমিনের জন্য সংরক্ষিত। সাধারণ রেজিস্ট্রেশন থেকে এটি ব্যবহার করা যাবে না।',
        };
      }
      const existing = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
        .limit(1);

      if (existing.length > 0) {
        return {
          available: false,
          field: 'email',
          message: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।',
        };
      }
    }

    if (phone) {
      const normalizedPhone = phone.trim();
      if (normalizedPhone) {
        const existing = await this.db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.phone, normalizedPhone), isNull(users.deletedAt)))
          .limit(1);

        if (existing.length > 0) {
          return {
            available: false,
            field: 'phone',
            message: 'এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য ফোন নম্বর ব্যবহার করুন।',
          };
        }
      }
    }

    return { available: true };
  }

  async syncProfile(
    decodedToken: any,
    requestedRole?: string,
    extraProfile?: { fullName?: string; phone?: string; address?: string }
  ) {
    const email = (decodedToken.email || '').trim().toLowerCase();
    const uid = decodedToken.uid;
    const phone = extraProfile?.phone?.trim() || null;

    if (!email) {
      throw new BadRequestException('বৈধ ইমেইল এড্রেস পাওয়া যায়নি');
    }

    // Master Admin email is strictly reserved for /masteradmin portal
    if (
      (email === 'admin@sadaqahbd.com' || email === 'admin@sadaqahbd.co') &&
      requestedRole &&
      requestedRole !== 'master_admin'
    ) {
      throw new BadRequestException(
        'admin@sadaqahbd.com শুধুমাত্র মাস্টার এডমিনের জন্য সংরক্ষিত। সাধারণ পোর্টাল থেকে এটি ব্যবহার করা যাবে না।'
      );
    }

    // 1. Strict Phone Uniqueness Check
    if (phone) {
      const existingByPhone = await this.db
        .select({ id: users.id, email: users.email, firebaseUid: users.firebaseUid })
        .from(users)
        .where(and(eq(users.phone, phone), isNull(users.deletedAt)))
        .limit(1);

      if (existingByPhone.length > 0) {
        const match = existingByPhone[0];
        // If this phone is registered to someone else (different email and different uid), REJECT!
        if (match.email.toLowerCase() !== email && match.firebaseUid !== uid) {
          throw new BadRequestException(
            'এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। একই ফোন নম্বর দিয়ে একাধিক অ্যাকাউন্ট তৈরি করা যাবে না।'
          );
        }
      }
    }

    // 2. Check if user already exists by firebaseUid
    const existingUsers = await this.db
      .select()
      .from(users)
      .where(and(eq(users.firebaseUid, uid), isNull(users.deletedAt)))
      .limit(1);

    if (existingUsers.length > 0) {
      const user = existingUsers[0];

      // Update phone/address/name if missing
      const updates: any = {};
      if (phone && !user.phone) updates.phone = phone;
      if (extraProfile?.address && !user.address) updates.address = extraProfile.address;
      if (
        extraProfile?.fullName &&
        (!user.fullName || user.fullName === email.split('@')[0])
      ) {
        updates.fullName = extraProfile.fullName;
      }

      // If requestedRole is explicitly provided, ensure user.role matches requestedRole
      // (Do not alter role if existing user is master_admin, super_admin, or admin)
      if (
        requestedRole &&
        [
          UserRole.DONOR,
          UserRole.STUDENT,
          UserRole.TEACHER,
          UserRole.ORGANIZATION,
        ].includes(requestedRole as any) &&
        !['master_admin', 'super_admin', 'admin'].includes(user.role)
      ) {
        if (user.role !== requestedRole) {
          updates.role = requestedRole;
          if (requestedRole === UserRole.DONOR) {
            updates.status = 'active';
          } else if (user.status !== 'active') {
            updates.status = 'pending';
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await this.db.update(users).set(updates).where(eq(users.id, user.id));
      }

      const perms = await this.db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));

      return {
        ...user,
        ...updates,
        permissions: perms,
      };
    }

    // 3. Check if user exists by email (e.g. Google Login with existing Email/Password account)
    const existingByEmail = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (existingByEmail.length > 0) {
      const user = existingByEmail[0];

      // Associate / link the new Firebase UID to this existing account
      const updates: any = { firebaseUid: uid };
      if (phone && !user.phone) updates.phone = phone;
      if (extraProfile?.address && !user.address) updates.address = extraProfile.address;
      if (
        extraProfile?.fullName &&
        (!user.fullName || user.fullName === email.split('@')[0])
      ) {
        updates.fullName = extraProfile.fullName;
      }

      // If requestedRole is explicitly provided, ensure user.role matches requestedRole
      if (
        requestedRole &&
        [
          UserRole.DONOR,
          UserRole.STUDENT,
          UserRole.TEACHER,
          UserRole.ORGANIZATION,
        ].includes(requestedRole as any) &&
        !['master_admin', 'super_admin', 'admin'].includes(user.role)
      ) {
        if (user.role !== requestedRole) {
          updates.role = requestedRole;
          if (requestedRole === UserRole.DONOR) {
            updates.status = 'active';
          } else if (user.status !== 'active') {
            updates.status = 'pending';
          }
        }
      }

      await this.db.update(users).set(updates).where(eq(users.id, user.id));

      const perms = await this.db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));

      return {
        ...user,
        ...updates,
        permissions: perms,
      };
    }

    // 4. If neither UID nor Email exists: create a NEW account
    const isMaster = email === 'admin@sadaqahbd.com';
    const newId = isMaster
      ? 'master-admin-0000-0000-0000-000000000001'
      : crypto.randomUUID();

    // Determine initial role
    let assignedRole: any = UserRole.DONOR;
    if (isMaster) {
      assignedRole = UserRole.MASTER_ADMIN;
    } else if (
      requestedRole &&
      [
        UserRole.DONOR,
        UserRole.STUDENT,
        UserRole.TEACHER,
        UserRole.ORGANIZATION,
      ].includes(requestedRole as any)
    ) {
      assignedRole = requestedRole;
    }

    // Role-based status: Donors active immediately, others active or verified per role
    const initialStatus =
      isMaster || assignedRole === UserRole.DONOR ? 'active' : 'pending';

    const isPasswordSet =
      decodedToken.firebase?.sign_in_provider === 'password';

    await this.db.insert(users).values({
      id: newId,
      firebaseUid: uid,
      email,
      fullName:
        extraProfile?.fullName || decodedToken.name || email.split('@')[0],
      phone: phone || null,
      address: extraProfile?.address || null,
      role: assignedRole,
      status: initialStatus,
      isPasswordSet,
      mustChangePassword: false,
    });

    const created = await this.db
      .select()
      .from(users)
      .where(eq(users.id, newId))
      .limit(1);

    return {
      ...created[0],
      permissions: [],
    };
  }

  async setInitialPassword(user: any, input: SetPasswordInput) {
    if (user.isPasswordSet) {
      throw new BadRequestException('Password has already been set for this account');
    }

    // Update password in Firebase Auth if service account is configured
    if (this.firebaseAdmin.hasValidServiceAccount) {
      try {
        await this.firebaseAdmin.auth.updateUser(user.firebaseUid, {
          password: input.password,
        });
      } catch (fbErr: any) {
        // Log warning but proceed with DB update so user setup is not broken
        console.warn(`[AuthService] Firebase Admin updateUser skipped: ${fbErr.message}`);
      }
    }

    const updates: any = {
      isPasswordSet: true,
      mustChangePassword: false,
    };

    // If role is provided, update role!
    if (
      input.role &&
      [
        UserRole.DONOR,
        UserRole.STUDENT,
        UserRole.TEACHER,
        UserRole.ORGANIZATION,
      ].includes(input.role as any) &&
      !['master_admin', 'super_admin', 'admin'].includes(user.role)
    ) {
      updates.role = input.role;
      if (input.role === UserRole.DONOR) {
        updates.status = 'active';
      } else if (user.status !== 'active') {
        updates.status = 'pending';
      }
    }

    if (input.phone) {
      const normalizedPhone = input.phone.trim();
      if (normalizedPhone) {
        const existingByPhone = await this.db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.phone, normalizedPhone),
              ne(users.id, user.id),
              isNull(users.deletedAt)
            )
          )
          .limit(1);

        if (existingByPhone.length > 0) {
          throw new BadRequestException(
            'এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। একই ফোন নম্বর দিয়ে একাধিক অ্যাকাউন্ট তৈরি করা যাবে না।'
          );
        }
        updates.phone = normalizedPhone;
      }
    }
    if (input.address && !user.address) updates.address = input.address;
    if (
      input.fullName &&
      (!user.fullName || user.fullName === user.email.split('@')[0])
    ) {
      updates.fullName = input.fullName;
    }

    // Mark as password set and save updates in MySQL DB
    await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id));

    const updated = await this.db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const perms = await this.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, user.id));

    return {
      success: true,
      message: 'Password and role set successfully. You can now access your dashboard.',
      user: {
        ...updated[0],
        permissions: perms,
      },
    };
  }

  async changePassword(user: any, input: ChangePasswordInput) {
    const isMasterAdmin =
      user.role === UserRole.MASTER_ADMIN ||
      (user.email && user.email.toLowerCase() === 'admin@sadaqahbd.com');

    if (isMasterAdmin) {
      if (input.oldPassword !== '12331233' && input.oldPassword !== 'admin123') {
        throw new BadRequestException('আপনার পুরাতন পাসওয়ার্ড সঠিক না');
      }
    } else {
      // Validate old password using Firebase Identity Toolkit REST API
      const apiKey =
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.FIREBASE_API_KEY ||
        process.env.FIREBASE_WEB_API_KEY;

      if (apiKey && user.email) {
        try {
          const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
          const res = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: input.oldPassword,
              returnSecureToken: true,
            }),
          });

          if (!res.ok) {
            const errData: any = await res.json().catch(() => ({}));
            const errMsg = errData?.error?.message || '';
            if (
              errMsg.includes('INVALID_') ||
              errMsg.includes('WRONG_') ||
              errMsg.includes('NOT_FOUND')
            ) {
              throw new BadRequestException('আপনার পুরাতন পাসওয়ার্ড সঠিক না');
            }
          }
        } catch (err: any) {
          if (err instanceof BadRequestException) {
            throw err;
          }
        }
      }
    }

    // Update password in Firebase Auth
    if (user.firebaseUid) {
      try {
        await this.firebaseAdmin.auth.updateUser(user.firebaseUid, {
          password: input.newPassword,
        });
      } catch (err: any) {
        if (!isMasterAdmin) {
          throw new BadRequestException(
            err.message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।'
          );
        }
      }
    }

    // Reset mustChangePassword flag in DB & mark password as set
    await this.db
      .update(users)
      .set({
        mustChangePassword: false,
        isPasswordSet: true,
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।',
    };
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; phone?: string; address?: string; avatarUrl?: string }
  ) {
    const toUpdate: any = {};
    if (data.fullName !== undefined && data.fullName.trim()) {
      toUpdate.fullName = data.fullName.trim();
    }
    if (data.phone !== undefined) {
      const cleanPhone = data.phone.trim();
      if (cleanPhone) {
        // check duplicate phone
        const existing = await this.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.phone, cleanPhone),
              ne(users.id, userId),
              isNull(users.deletedAt)
            )
          )
          .limit(1);
        if (existing.length > 0) {
          throw new BadRequestException(
            'এই ফোন নম্বরটি ইতোমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।'
          );
        }
        toUpdate.phone = cleanPhone;
      } else {
        toUpdate.phone = null;
      }
    }
    if (data.address !== undefined) {
      toUpdate.address = data.address.trim() || null;
    }
    if (data.avatarUrl !== undefined) {
      toUpdate.avatarUrl = data.avatarUrl || null;
    }

    if (Object.keys(toUpdate).length > 0) {
      await this.db.update(users).set(toUpdate).where(eq(users.id, userId));
      if (data.avatarUrl !== undefined) {
        try {
          await this.db
            .update(studentProfiles)
            .set({ photoUrl: data.avatarUrl || null })
            .where(eq(studentProfiles.userId, userId));
        } catch {
          // ignore if user is not a student
        }
      }
    }

    const updated = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const perms = await this.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    return {
      success: true,
      message: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
      user: {
        ...updated[0],
        permissions: perms,
      },
    };
  }

  async masterLogin(email?: string, password?: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (
      cleanEmail !== 'admin@sadaqahbd.com' ||
      (cleanPassword !== '12331233' && cleanPassword !== 'admin123')
    ) {
      throw new BadRequestException('অবৈধ মাস্টার এডমিন ইমেইল বা পাসওয়ার্ড।');
    }

    // Ensure Master Admin exists in MySQL
    let [masterUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.MASTER_ADMIN))
      .limit(1);

    if (!masterUser) {
      const masterUserId = '00000000-0000-0000-0000-000000000001';
      await this.db.insert(users).values({
        id: masterUserId,
        firebaseUid: '7HasyqiRFpWzwxfCnwzuVzo5Rxv1',
        email: 'admin@sadaqahbd.com',
        phone: '+8801700000000',
        fullName: 'Master Admin Owner',
        role: UserRole.MASTER_ADMIN,
        status: 'active',
        isPasswordSet: true,
        mustChangePassword: false,
      });

      [masterUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, masterUserId))
        .limit(1);
    }

    const perms = await this.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, masterUser.id));

    const token = signMasterToken({
      id: masterUser.id,
      email: masterUser.email,
      role: masterUser.role,
    });

    return {
      success: true,
      token,
      user: {
        ...masterUser,
        permissions: perms,
      },
    };
  }
}
