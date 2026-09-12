import {
  Controller,
  Post,
  Get,
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

  @Post('sync-profile')
  async syncProfile(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.split('Bearer ')[1].trim();
    const decoded = await this.firebaseAdmin.verifyIdToken(token);
    return this.authService.syncProfile(decoded);
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
}
