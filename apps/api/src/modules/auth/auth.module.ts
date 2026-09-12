import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MasterAdminGuard } from './guards/master-admin.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    FirebaseAdminService,
    AuthService,
    FirebaseAuthGuard,
    RolesGuard,
    MasterAdminGuard,
  ],
  exports: [
    FirebaseAdminService,
    AuthService,
    FirebaseAuthGuard,
    RolesGuard,
    MasterAdminGuard,
  ],
})
export class AuthModule {}
