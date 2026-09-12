import { z } from 'zod';
import { PermissionModuleKey } from './enums';

export const ModulePermissionSchema = z.object({
  moduleKey: z.nativeEnum(PermissionModuleKey),
  canView: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canApprove: z.boolean().default(false),
});

export type ModulePermission = z.infer<typeof ModulePermissionSchema>;

export const UpdateUserPermissionsSchema = z.object({
  userId: z.string().uuid(),
  permissions: z.array(ModulePermissionSchema),
});

export type UpdateUserPermissionsInput = z.infer<
  typeof UpdateUserPermissionsSchema
>;
