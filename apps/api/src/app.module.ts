import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { DonationsModule } from './modules/donations/donations.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { MasterAdminModule } from './modules/masteradmin/masteradmin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TerminusModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    PostsModule,
    DonationsModule,
    ComplaintsModule,
    MasterAdminModule,
  ],
})
export class AppModule {}
