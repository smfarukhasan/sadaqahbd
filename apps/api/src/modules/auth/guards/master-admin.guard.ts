import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@sadaqahbd/schema';

@Injectable()
export class MasterAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Access denied: Authentication required');
    }

    if (
      user.role === UserRole.MASTER_ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      return true;
    }

    throw new ForbiddenException(
      'Access denied: This endpoint is restricted strictly to Master and Super Admins'
    );

    return true;
  }
}
