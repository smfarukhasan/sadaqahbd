import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import { UserRole } from '@sadaqahbd/schema';

@Controller('maintenance')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // ----------------------------------------------------
  // Apps Privilege Endpoints
  // ----------------------------------------------------

  @Get('apps-privilege')
  async getAppsPrivilegeStatus() {
    // Run background check for alerts
    this.maintenanceService.checkAppsPrivilegeAlerts().catch(() => {});
    return this.maintenanceService.getAppsPrivilegeStatus();
  }

  @Post('apps-privilege/create-payment-session')
  async createAppsPrivilegePaymentSession(
    @CurrentUser() user: any,
    @Body() body: { planType: 'monthly' | 'yearly'; returnUrl: string; cancelUrl?: string }
  ) {
    return this.maintenanceService.createAppsPrivilegePaymentSession(
      user,
      body.planType,
      body.returnUrl,
      body.cancelUrl
    );
  }

  @Get('apps-privilege/verify-payment/:transactionId')
  async verifyAppsPrivilegePayment(@Param('transactionId') transactionId: string) {
    return this.maintenanceService.verifyAppsPrivilegePayment(transactionId);
  }

  @Get('apps-privilege/check-alerts')
  async checkAppsPrivilegeAlerts() {
    await this.maintenanceService.checkAppsPrivilegeAlerts();
    return { success: true, message: 'Apps Privilege alerts checked.' };
  }

  // ----------------------------------------------------
  // SMS Packages Endpoints
  // ----------------------------------------------------

  @Get('sms/meter')
  async getSmsMeter() {
    return this.maintenanceService.getSmsMeter();
  }

  @Get('sms/packages')
  async getSmsPackages() {
    return this.maintenanceService.getSmsPackages();
  }

  @Post('sms/buy-package')
  async buySmsPackage(
    @CurrentUser() user: any,
    @Body() body: { packageId: string; returnUrl: string; cancelUrl?: string }
  ) {
    return this.maintenanceService.buySmsPackage(
      user,
      body.packageId,
      body.returnUrl,
      body.cancelUrl
    );
  }

  @Get('sms/verify-purchase/:transactionId')
  async verifySmsPurchase(@Param('transactionId') transactionId: string) {
    return this.maintenanceService.verifySmsPurchase(transactionId);
  }

  @Get('sms/purchase-history')
  async getSmsPurchaseHistory() {
    return this.maintenanceService.getSmsPurchaseHistory();
  }
}
