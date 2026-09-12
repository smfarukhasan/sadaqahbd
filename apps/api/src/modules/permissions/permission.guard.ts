import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_CHECK_KEY,
  PermissionAction,
} from './permission.decorator';
import { PermissionModuleKeyType, UserRole } from '@sadaqahbd/schema';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const check = this.reflector.getAllAndOverride<{
      moduleKey: PermissionModuleKeyType;
      action: PermissionAction;
    }>(PERMISSION_CHECK_KEY, [context.getHandler(), context.getClass()]);

    if (!check) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Master Admin has universal access
    if (user.role === UserRole.MASTER_ADMIN) {
      return true;
    }

    const userPerms: Array<{
      moduleKey: string;
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canApprove: boolean;
    }> = user.permissions || [];

    const modulePerm = userPerms.find((p) => p.moduleKey === check.moduleKey);

    if (!modulePerm || !modulePerm.canView) {
      throw new ForbiddenException(
        `Access denied: No view permission for module '${check.moduleKey}'`
      );
    }

    if (check.action === 'canEdit' && !modulePerm.canEdit) {
      throw new ForbiddenException(
        `Access denied: Edit permission missing for module '${check.moduleKey}'`
      );
    }

    if (check.action === 'canDelete' && !modulePerm.canDelete) {
      throw new ForbiddenException(
        `Access denied: Delete permission missing for module '${check.moduleKey}'`
      );
    }

    if (check.action === 'canApprove' && !modulePerm.canApprove) {
      throw new ForbiddenException(
        `Access denied: Approval permission missing for module '${check.moduleKey}'`
      );
    }

    return true;
  }
}
