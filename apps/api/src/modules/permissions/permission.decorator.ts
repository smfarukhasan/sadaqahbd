import { SetMetadata } from '@nestjs/common';
import { PermissionModuleKeyType } from '@sadaqahbd/schema';

export type PermissionAction = 'canView' | 'canEdit' | 'canDelete' | 'canApprove';

export const PERMISSION_CHECK_KEY = 'permission_check';

export const RequirePermission = (
  moduleKey: PermissionModuleKeyType,
  action: PermissionAction = 'canView'
) => SetMetadata(PERMISSION_CHECK_KEY, { moduleKey, action });
