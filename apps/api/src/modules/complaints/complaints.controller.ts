import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import {
  CreateComplaintSchema,
  CreateComplaintInput,
  ReplyComplaintSchema,
  ReplyComplaintInput,
  UserRole,
} from '@sadaqahbd/schema';

@Controller('complaints')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  async submitComplaint(
    @CurrentUser() user: any,
    @Body() body: CreateComplaintInput
  ) {
    const validated = CreateComplaintSchema.parse(body);
    return this.complaintsService.submitComplaint(user, validated);
  }

  @Get('my')
  async getMyComplaints(@CurrentUser() user: any) {
    return this.complaintsService.getMyComplaints(user);
  }

  @Get('admin-list')
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async listComplaints(@CurrentUser() user: any) {
    return this.complaintsService.listComplaints(user);
  }

  @Post('admin-reply')
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN)
  async replyComplaint(
    @CurrentUser() user: any,
    @Body() body: ReplyComplaintInput
  ) {
    const validated = ReplyComplaintSchema.parse(body);
    return this.complaintsService.replyComplaint(user, validated);
  }
}
