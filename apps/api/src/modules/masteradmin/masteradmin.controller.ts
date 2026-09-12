import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { MasterAdminGuard } from '../auth/guards/master-admin.guard';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import { UsersService } from '../users/users.service';
import {
  CreateAdminUserSchema,
  CreateAdminUserInput,
  UpdateUserPermissionsInput,
  UserRole,
} from '@sadaqahbd/schema';

@Controller('masteradmin')
@UseGuards(FirebaseAuthGuard, MasterAdminGuard)
export class MasterAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('dashboard-stats')
  async getStats(@CurrentUser() user: any) {
    return {
      masterEmail: user.email,
      fullName: user.fullName,
      status: 'Master Admin Root Access Active',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('super-admins')
  async listSuperAdmins(@CurrentUser() user: any) {
    return this.usersService.listUsersByRole(UserRole.SUPER_ADMIN, user);
  }

  @Post('super-admins')
  async createSuperAdmin(
    @CurrentUser() user: any,
    @Body() body: CreateAdminUserInput
  ) {
    const validated = CreateAdminUserSchema.parse({
      ...body,
      role: UserRole.SUPER_ADMIN,
    });
    return this.usersService.createAdminUser(user, validated);
  }

  @Delete('super-admins/:id')
  async deleteSuperAdmin(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.usersService.deleteUser(id, user);
  }
}
