import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UserRole } from '@sadaqahbd/schema';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  /**
   * Request OTP for a phone number
   */
  @Post('send-otp')
  @UseGuards(FirebaseAuthGuard)
  async sendOtp(
    @CurrentUser() user: any,
    @Body() body: { phone: string; isSecondary?: boolean }
  ) {
    return this.smsService.sendOtp(user?.id || null, body.phone, body.isSecondary);
  }

  /**
   * Verify entered OTP code
   */
  @Post('verify-otp')
  @UseGuards(FirebaseAuthGuard)
  async verifyOtp(
    @CurrentUser() user: any,
    @Body() body: { phone: string; otpCode: string; isSecondary?: boolean }
  ) {
    return this.smsService.verifyOtp(user.id, body.phone, body.otpCode, body.isSecondary);
  }

  /**
   * Get verified phone numbers of current user
   */
  @Get('my-phones')
  @UseGuards(FirebaseAuthGuard)
  async getMyPhones(@CurrentUser() user: any) {
    return this.smsService.getUserVerifiedPhones(user.id);
  }

  /**
   * Remove a verified phone (allowed only if user has 2 verified numbers)
   */
  @Delete('my-phones/:phone')
  @UseGuards(FirebaseAuthGuard)
  async removePhone(@CurrentUser() user: any, @Param('phone') phone: string) {
    return this.smsService.removeVerifiedPhone(user.id, phone);
  }

  /**
   * Student applies for exemption from phone verification
   */
  @Post('student-exemption')
  @UseGuards(FirebaseAuthGuard)
  async applyStudentExemption(
    @CurrentUser() user: any,
    @Body() body: { reason: string }
  ) {
    return this.smsService.applyStudentExemption(user.id, body.reason);
  }

  /**
   * Student checks their exemption status and history
   */
  @Get('student-exemption')
  @UseGuards(FirebaseAuthGuard)
  async getStudentExemptionStatus(@CurrentUser() user: any) {
    return this.smsService.getStudentExemptionStatus(user.id);
  }

  /**
   * Admin lists all student phone exemption requests
   */
  @Get('admin/exemptions')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listAllExemptions() {
    return this.smsService.listAllStudentExemptions();
  }

  /**
   * Admin reviews (Accepts with Date Picker or Rejects with Reason) a student exemption request
   */
  @Post('admin/exemptions/:id/review')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async reviewExemption(
    @CurrentUser() adminUser: any,
    @Param('id') exemptionId: string,
    @Body() body: { action: 'approve' | 'reject'; validUntil?: string; rejectionReason?: string }
  ) {
    return this.smsService.reviewStudentExemption(
      adminUser,
      exemptionId,
      body.action,
      body.validUntil,
      body.rejectionReason
    );
  }
}
