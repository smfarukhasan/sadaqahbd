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

  @Get(':id/members')
  @UseGuards(FirebaseAuthGuard)
  async getOrganizationMembers(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.organizationsService.getOrganizationMembers(user, id);
  }
}
