import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { FirebaseAdminService } from '../firebase-admin.service';
import { DRIZZLE_DB } from '../../../database/database.module';
import { DrizzleDB, users, userPermissions } from '../../../database';
import { eq } from 'drizzle-orm';
import { UserRole } from '@sadaqahbd/schema';
import { verifyMasterToken } from '../master-token.util';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token missing or malformed');
    }

    const idToken = authHeader.split('Bearer ')[1].trim();

    // 1. Fast-path: Check if token is a valid Master Admin session token
    const masterPayload = verifyMasterToken(idToken);
    if (masterPayload && masterPayload.isMasterSession) {
      let [masterUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.role, UserRole.MASTER_ADMIN))
        .limit(1);

      if (!masterUser) {
        const [byEmail] = await this.db
          .select()
          .from(users)
          .where(eq(users.email, masterPayload.email))
          .limit(1);
        masterUser = byEmail;
      }

      if (masterUser) {
        const perms = await this.db
          .select()
          .from(userPermissions)
          .where(eq(userPermissions.userId, masterUser.id));

        request.user = {
          ...masterUser,
          permissions: perms,
        };
        return true;
      }
    }

    try {
      const decoded = await this.firebaseAdmin.verifyIdToken(idToken);
      const email = decoded.email;

      if (!email) {
        throw new UnauthorizedException('Token contains no email');
      }

      // Check user in MySQL DB
      let userList = await this.db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, decoded.uid))
        .limit(1);

      if (userList.length === 0) {
        // Try finding by email (e.g. Master Admin or Admin created user syncing firebase UID)
        userList = await this.db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (userList.length > 0) {
          // Sync Firebase UID
          await this.db
            .update(users)
            .set({ firebaseUid: decoded.uid })
            .where(eq(users.id, userList[0].id));
        } else {
          // If Master Admin email
          const isMaster = email.toLowerCase() === 'admin@sadaqahbd.com';
          const newId = isMaster
            ? 'master-admin-0000-0000-0000-000000000001'
            : crypto.randomUUID();

          await this.db.insert(users).values({
            id: newId,
            firebaseUid: decoded.uid,
            email,
            fullName: decoded.name || email.split('@')[0],
            role: isMaster ? UserRole.MASTER_ADMIN : UserRole.DONOR,
            status: 'active',
            isPasswordSet: true,
          });

          userList = await this.db
            .select()
            .from(users)
            .where(eq(users.id, newId))
            .limit(1);
        }
      }

      const currentUser = userList[0];

      // Block suspended users from accessing protected API endpoints
      if (
        currentUser.status === 'suspended' &&
        currentUser.role !== UserRole.MASTER_ADMIN
      ) {
        throw new ForbiddenException(
          'Your account has been deactivated by administration. Platform actions are restricted.'
        );
      }

      // Fetch user permissions
      const perms = await this.db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, currentUser.id));

      request.user = {
        ...currentUser,
        permissions: perms,
      };

      return true;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired Firebase token: ' + err.message);
    }
  }
}
