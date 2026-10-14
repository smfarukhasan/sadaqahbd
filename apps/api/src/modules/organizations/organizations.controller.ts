import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  OrganizationsService,
  ApplyOrgDto,
  RequestNewOrgDto,
} from './organizations.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import { UserRole } from '@sadaqahbd/schema';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('active')
  async getActiveOrganizations() {
    return this.organizationsService.getActiveOrganizations();
  }

  @Post('apply')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async applyOrganization(
    @CurrentUser() user: any,
    @Body() dto: ApplyOrgDto
  ) {
    return this.organizationsService.applyOrganization(user, dto);
  }

  @Get('my-status')
  @UseGuards(FirebaseAuthGuard)
  async getMyStatus(@CurrentUser() user: any) {
    return this.organizationsService.getMyStatus(user);
  }

  @Post('request-new')
  @UseGuards(FirebaseAuthGuard)
  async requestNewOrganization(
    @CurrentUser() user: any,
    @Body() dto: RequestNewOrgDto
  ) {
    return this.organizationsService.requestNewOrganization(user, dto);
  }

  @Get('pending-affiliations')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async getPendingAffiliations(@CurrentUser() user: any) {
    return this.organizationsService.getPendingAffiliations(user);
  }

  @Patch('affiliations/:role/:id/review')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async reviewAffiliationByOrg(
    @CurrentUser() user: any,
    @Param('role') role: 'teacher' | 'student',
    @Param('id') id: string,
    @Body() body: { approved: boolean; reason?: string }
  ) {
    return this.organizationsService.reviewAffiliationByOrg(
      user,
      role,
      id,
      body.approved,
      body.reason
    );
  }

  @Patch('affiliations/student/:id/correct')
  @Roles(UserRole.ORGANIZATION)
  async correctStudentAffiliation(
    @CurrentUser() user: any,
    @Param('id') profileId: string,
    @Body() body: any
  ) {
    return this.organizationsService.correctStudentBeforeApproval(
      user,
      profileId,
      body
    );
  }

  @Get('my-members')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.TEACHER, UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getMyOrganizationMembers(@CurrentUser() user: any) {
    return this.organizationsService.getOrganizationMembers(user, 'my');
  }

  @Post('members/:role/:id/remove-request')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async requestMemberRemoval(
    @CurrentUser() user: any,
    @Param('role') role: 'teacher' | 'student',
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.organizationsService.requestMemberRemoval(user, role, id, reason);
  }

  @Get('removal-requests')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listRemovalRequests(@CurrentUser() user: any) {
    return this.organizationsService.listRemovalRequests(user);
  }

  @Patch('removal-requests/:id/review')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async reviewMemberRemoval(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean; reason?: string }
  ) {
    return this.organizationsService.reviewMemberRemoval(user, id, body.approved, body.reason);
  }

  @Get('students-donations')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getOrganizationStudentDonations(@CurrentUser() user: any) {
    return this.organizationsService.getOrganizationStudentDonations(user);
  }

  @Get(':id/members')
  @UseGuards(FirebaseAuthGuard)
  async getOrganizationMembers(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.organizationsService.getOrganizationMembers(user, id);
  }

  @Get('transfer-requests')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async getOrganizationTransferRequests(@CurrentUser() user: any) {
    return this.organizationsService.getOrganizationTransferRequests(user);
  }

  @Patch('transfers/:id/review')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async reviewTransferByOrg(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean; reason?: string }
  ) {
    return this.organizationsService.reviewTransferByOrg(
      user,
      id,
      body.approved,
      body.reason
    );
  }
}
