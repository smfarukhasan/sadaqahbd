import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { CurrentUser } from './guards/current-user.decorator';
import {
  SetPasswordSchema,
  SetPasswordInput,
  ChangePasswordSchema,
  ChangePasswordInput,
} from '@sadaqahbd/schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  @Post('check-availability')
  async checkAvailability(@Body() body: { email?: string; phone?: string }) {
    return this.authService.checkAvailability(body.email, body.phone);
  }

  @Post('master-login')
  async masterLogin(@Body() body: { email?: string; password?: string }) {
    return this.authService.masterLogin(body?.email, body?.password);
  }

  @Post('sync-profile')
  async syncProfile(
    @Headers('authorization') authHeader: string,
    @Body()
    body?: {
      role?: string;
      fullName?: string;
      phone?: string;
      address?: string;
    }
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.split('Bearer ')[1].trim();
    const decoded = await this.firebaseAdmin.verifyIdToken(token);
    return this.authService.syncProfile(decoded, body?.role, body);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Post('set-password')
  @UseGuards(FirebaseAuthGuard)
  async setPassword(
    @CurrentUser() user: any,
    @Body() body: SetPasswordInput
  ) {
    const validated = SetPasswordSchema.parse(body);
    return this.authService.setInitialPassword(user, validated);
  }

  @Post('change-password')
  @UseGuards(FirebaseAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: ChangePasswordInput
  ) {
    const validated = ChangePasswordSchema.parse(body);
    return this.authService.changePassword(user, validated);
  }

  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: { fullName?: string; phone?: string; address?: string; avatarUrl?: string }
  ) {
    return this.authService.updateProfile(user.id, body);
  }
}
