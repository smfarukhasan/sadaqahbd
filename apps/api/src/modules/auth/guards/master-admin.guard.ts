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

    if (
      !user ||
      user.role !== UserRole.MASTER_ADMIN ||
      user.email.toLowerCase() !== 'admin@sadaqahbd.com'
    ) {
      throw new ForbiddenException(
        'Access denied: This endpoint is restricted strictly to the Master Admin'
      );
    }

    return true;
  }
}
