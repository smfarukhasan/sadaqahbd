import { Module } from '@nestjs/common';
import { MasterAdminController } from './masteradmin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [MasterAdminController],
})
export class MasterAdminModule {}
