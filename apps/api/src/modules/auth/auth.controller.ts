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
  LocalLoginSchema,
  LocalLoginInput,
  LocalRegisterSchema,
  LocalRegisterInput,
} from '@sadaqahbd/schema';

import { signAuthToken } from './master-token.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  @Post('local-login')
  async localLogin(@Body() body: LocalLoginInput) {
    const validated = LocalLoginSchema.parse(body);
    return this.authService.localLogin(validated.identifier, validated.password);
  }

  @Post('local-register')
  async localRegister(@Body() body: LocalRegisterInput) {
    const validated = LocalRegisterSchema.parse(body);
    return this.authService.localRegister(validated);
  }

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
    const user = await this.authService.syncProfile(decoded, body?.role, body);
    const sessionToken = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isMasterSession: user.role === 'master_admin',
    });
    return {
      ...user,
      token: sessionToken,
    };
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
