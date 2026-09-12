import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DB } from '../../database/database.module';
import { DrizzleDB, users, userPermissions } from '../../database';
import { FirebaseAdminService } from './firebase-admin.service';
import { eq } from 'drizzle-orm';
import {
  RegisterUserInput,
  SetPasswordInput,
  ChangePasswordInput,
  UserRole,
} from '@sadaqahbd/schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  async syncProfile(decodedToken: any) {
    const email = decodedToken.email;
    const uid = decodedToken.uid;

    const existingUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      const perms = await this.db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));

      return {
        ...user,
        permissions: perms,
      };
    }

    // Check by email
    const existingByEmail = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingByEmail.length > 0) {
      const user = existingByEmail[0];
      await this.db
        .update(users)
        .set({ firebaseUid: uid })
        .where(eq(users.id, user.id));

      const perms = await this.db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, user.id));

      return {
        ...user,
        firebaseUid: uid,
        permissions: perms,
      };
    }

    // New user default registration
    const isMaster = email.toLowerCase() === 'admin@sadaqahbd.com';
    const newId = isMaster
      ? 'master-admin-0000-0000-0000-000000000001'
      : crypto.randomUUID();

    // If Google login without prior password, isPasswordSet is false
    const isPasswordSet =
      decodedToken.firebase?.sign_in_provider === 'password';

    await this.db.insert(users).values({
      id: newId,
      firebaseUid: uid,
      email,
      fullName: decodedToken.name || email.split('@')[0],
      role: isMaster ? UserRole.MASTER_ADMIN : UserRole.DONOR,
      status: 'active',
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

    // Update password in Firebase Auth
    await this.firebaseAdmin.auth.updateUser(user.firebaseUid, {
      password: input.password,
    });

    // Mark as password set in MySQL DB
    await this.db
      .update(users)
      .set({ isPasswordSet: true, mustChangePassword: false })
      .where(eq(users.id, user.id));

    return {
      success: true,
      message: 'Password set successfully. You can now access all features.',
    };
  }

  async changePassword(user: any, input: ChangePasswordInput) {
    // Update password in Firebase Auth
    await this.firebaseAdmin.auth.updateUser(user.firebaseUid, {
      password: input.newPassword,
    });

    // Reset mustChangePassword flag in DB
    await this.db
      .update(users)
      .set({ mustChangePassword: false })
      .where(eq(users.id, user.id));

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
