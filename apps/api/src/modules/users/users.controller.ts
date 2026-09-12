import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import {
  CreateAdminUserSchema,
  CreateAdminUserInput,
  CreateGeneralUserSchema,
  CreateGeneralUserInput,
  StudentVerificationProfileSchema,
  StudentVerificationProfileInput,
  UserRole,
  UserRoleType,
} from '@sadaqahbd/schema';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('admin')
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async createAdmin(
    @CurrentUser() user: any,
    @Body() body: CreateAdminUserInput
  ) {
    const validated = CreateAdminUserSchema.parse(body);
    return this.usersService.createAdminUser(user, validated);
  }

  @Post('general')
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ORGANIZATION)
  async createGeneral(
    @CurrentUser() user: any,
    @Body() body: CreateGeneralUserInput
  ) {
    const validated = CreateGeneralUserSchema.parse(body);
    return this.usersService.createGeneralUser(user, validated);
  }

  @Get('by-role/:role')
  async listByRole(
    @CurrentUser() user: any,
    @Param('role') role: UserRoleType
  ) {
    return this.usersService.listUsersByRole(role, user);
  }

  @Delete(':id')
  async deleteUser(
    @CurrentUser() user: any,
    @Param('id') targetId: string
  ) {
    return this.usersService.deleteUser(targetId, user);
  }

  @Post('student/profile')
  @Roles(UserRole.STUDENT)
  async submitStudentProfile(
    @CurrentUser() user: any,
    @Body() body: StudentVerificationProfileInput
  ) {
    const validated = StudentVerificationProfileSchema.parse(body);
    return this.usersService.submitStudentProfile(user, validated);
  }

  @Post('student/:id/verify')
  @Roles(UserRole.ORGANIZATION, UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN)
  async verifyStudent(
    @CurrentUser() user: any,
    @Param('id') studentId: string,
    @Body('approved') approved: boolean
  ) {
    return this.usersService.verifyStudentProfile(studentId, user, approved);
  }
}
