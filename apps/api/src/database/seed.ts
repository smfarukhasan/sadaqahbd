import { db, users, userPermissions } from './index';
import { eq, and } from 'drizzle-orm';
import { PermissionModuleKey, UserRole } from '@sadaqahbd/schema';

export async function seedMasterAdmin() {
  console.log('Seeding Master Admin...');
  const masterEmail = 'admin@sadaqahbd.com';

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, masterEmail))
    .limit(1);

  let masterUserId = '00000000-0000-0000-0000-000000000001';

  if (existing.length === 0) {
    await db.insert(users).values({
      id: masterUserId,
      firebaseUid: 'firebase-master-admin-root',
      email: masterEmail,
      phone: '+8801700000000',
      fullName: 'Master Admin Owner',
      role: UserRole.MASTER_ADMIN,
      status: 'active',
      isPasswordSet: true,
      mustChangePassword: false,
    });
    console.log('Master admin created in MySQL DB.');
  } else {
    masterUserId = existing[0].id;
    console.log('Master admin already exists in MySQL DB.');
  }

  // Assign full permissions across all modules
  const allModules = Object.values(PermissionModuleKey);
  for (const moduleKey of allModules) {
    const existingPerm = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, masterUserId),
          eq(userPermissions.moduleKey, moduleKey)
        )
      )
      .limit(1);

    if (existingPerm.length === 0) {
      await db.insert(userPermissions).values({
        userId: masterUserId,
        moduleKey,
        canView: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
      });
    }
  }

  console.log('Master admin seeding complete with full permissions.');
}

if (require.main === module) {
  seedMasterAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
