import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import {
  CreateDonationSchema,
  CreateDonationInput,
  ReviewDonationSchema,
  ReviewDonationInput,
  AllocateFundSchema,
  AllocateFundInput,
  CreateItemDonationSchema,
  CreateItemDonationInput,
  ReviewItemDonationSchema,
  ReviewItemDonationInput,
  DonorShipItemDonationSchema,
  DonorShipItemDonationInput,
  AdminFollowUpItemDonationSchema,
  AdminFollowUpItemDonationInput,
  UserRole,
} from '@sadaqahbd/schema';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get('ledger-stats')
  async getLedgerStats() {
    return this.donationsService.getTransparencyLedgerStats();
  }

  @Get('pending')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async listPendingDonations() {
    return this.donationsService.listPendingDonations();
  }

  @Get('history')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async listDonationsHistory() {
    return this.donationsService.listDonationsHistory();
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async submitDonation(
    @CurrentUser() user: any,
    @Body() body: CreateDonationInput
  ) {
    const validated = CreateDonationSchema.parse(body);
    return this.donationsService.submitDonation(user, validated);
  }

  @Post('review')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async reviewDonation(
    @CurrentUser() user: any,
    @Body() body: ReviewDonationInput
  ) {
    const validated = ReviewDonationSchema.parse(body);
    return this.donationsService.reviewDonation(user, validated);
  }

  @Post('allocate-fund')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async allocateFund(
    @CurrentUser() user: any,
    @Body() body: AllocateFundInput
  ) {
    const validated = AllocateFundSchema.parse(body);
    return this.donationsService.allocateRandomFund(user, validated);
  }

  @Get('allocations/history')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async listAllocationsHistory() {
    return this.donationsService.listAllocationsHistory();
  }

  @Get('allocations/eligible-posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async listEligibleStudentPosts() {
    return this.donationsService.listEligibleStudentPostsForAllocation();
  }

  @Get('my-history')
  @UseGuards(FirebaseAuthGuard)
  async getMyHistory(@CurrentUser() user: any) {
    return this.donationsService.getDonorHistory(user);
  }

  // --------------------------------------------------------------------------
  // ITEM / NON-MONETARY DONATIONS ENDPOINTS
  // --------------------------------------------------------------------------
  @Post('items')
  @UseGuards(FirebaseAuthGuard)
  async submitItemDonation(
    @CurrentUser() user: any,
    @Body() body: CreateItemDonationInput
  ) {
    const validated = CreateItemDonationSchema.parse(body);
    return this.donationsService.submitItemDonation(user, validated);
  }

  @Post('items/review')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async reviewItemDonation(
    @CurrentUser() user: any,
    @Body() body: ReviewItemDonationInput
  ) {
    const validated = ReviewItemDonationSchema.parse(body);
    return this.donationsService.reviewItemDonation(user, validated);
  }

  @Post('items/ship')
  @UseGuards(FirebaseAuthGuard)
  async shipItemDonation(
    @CurrentUser() user: any,
    @Body() body: DonorShipItemDonationInput
  ) {
    const validated = DonorShipItemDonationSchema.parse(body);
    return this.donationsService.shipItemDonation(user, validated);
  }

  @Post('items/follow-up')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async adminFollowUpItemDonation(
    @CurrentUser() user: any,
    @Body() body: AdminFollowUpItemDonationInput
  ) {
    const validated = AdminFollowUpItemDonationSchema.parse(body);
    return this.donationsService.adminFollowUpItemDonation(user, validated);
  }

  @Get('items/my-history')
  @UseGuards(FirebaseAuthGuard)
  async getMyItemHistory(@CurrentUser() user: any) {
    return this.donationsService.getMyItemDonations(user);
  }

  @Get('items/requests')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async listItemDonations() {
    return this.donationsService.listItemDonationRequests();
  }
}

