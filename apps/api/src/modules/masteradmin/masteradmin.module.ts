import { Module } from '@nestjs/common';
import { MasterAdminController } from './masteradmin.controller';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [UsersModule, DatabaseModule],
  controllers: [MasterAdminController],
})
export class MasterAdminModule {}
