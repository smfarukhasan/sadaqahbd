import {
  Controller,
  Post,
  Get,
  Patch,
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

  @Get('org-requests')
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listOrgRequests() {
    return this.usersService.listPendingOrgRequests();
  }

  @Post('org/:id/verify')
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verifyOrganization(
    @CurrentUser() user: any,
    @Param('id') orgId: string,
    @Body() body: any
  ) {
    const approved = body?.approved !== false && body?.approved !== 'false';
    return this.usersService.verifyOrganization(orgId, user, approved, body?.reason, body);
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

  @Get('org-teachers')
  @Roles(UserRole.ORGANIZATION, UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN)
  async listOrgTeachers(@CurrentUser() user: any) {
    return this.usersService.listOrgTeachers(user);
  }

  @Post('teacher/:id/verify')
  @Roles(UserRole.ORGANIZATION, UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN)
  async verifyTeacher(
    @CurrentUser() user: any,
    @Param('id') teacherId: string,
    @Body('approved') approved: boolean
  ) {
    return this.usersService.verifyTeacher(user, teacherId, approved);
  }

  @Post('affiliate')
  async applyAffiliation(
    @CurrentUser() user: any,
    @Body()
    body: {
      organizationId: string;
      department?: string;
      designation?: string;
      employeeId?: string;
      studentClassRoll?: string;
      address?: string;
      phone?: string;
    }
  ) {
    return this.usersService.applyAffiliation(user, body);
  }

  @Get('my-affiliation')
  async getMyAffiliation(@CurrentUser() user: any) {
    return this.usersService.getMyAffiliation(user);
  }

  @Get('pending-affiliations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async listPendingAdminAffiliations() {
    return this.usersService.listPendingAdminAffiliations();
  }

  @Patch('affiliations/:role/:id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async reviewAdminAffiliation(
    @CurrentUser() user: any,
    @Param('role') role: 'teacher' | 'student',
    @Param('id') id: string,
    @Body() body: { approved: boolean; reason?: string }
  ) {
    return this.usersService.reviewAdminAffiliation(
      user,
      role,
      id,
      body.approved,
      body.reason
    );
  }

  @Get('my-student-profile')
  async getMyStudentProfile(@CurrentUser() user: any) {
    return this.usersService.getMyStudentProfile(user);
  }

  @Patch('my-student-profile')
  async updateMyStudentProfile(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.usersService.updateMyStudentProfile(user, body);
  }

  @Get('students/:id/details')
  @Roles(
    UserRole.MASTER_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ORGANIZATION,
    UserRole.TEACHER
  )
  async getStudentDetails(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.usersService.getStudentDetails(user, id);
  }
}


