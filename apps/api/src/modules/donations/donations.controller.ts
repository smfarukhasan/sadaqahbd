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
  UserRole,
} from '@sadaqahbd/schema';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get('ledger-stats')
  async getLedgerStats() {
    return this.donationsService.getTransparencyLedgerStats();
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

  @Get('my-history')
  @UseGuards(FirebaseAuthGuard)
  async getMyHistory(@CurrentUser() user: any) {
    return this.donationsService.getDonorHistory(user);
  }
}
