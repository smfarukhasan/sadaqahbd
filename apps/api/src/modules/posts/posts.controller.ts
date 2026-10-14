import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../auth/guards/current-user.decorator';
import {
  CreateStudentPostSchema,
  CreateStudentPostInput,
  UserRole,
} from '@sadaqahbd/schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('public')
  async listPublic() {
    return this.postsService.listPublicVerifiedPosts();
  }

  @Get('pending-approvals')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listPendingApprovals() {
    return this.postsService.listPendingSuperAdminPosts();
  }

  @Get('approvals-history')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listApprovalsHistory() {
    return this.postsService.listSuperAdminPostsHistory();
  }

  @Get('my-posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.MASTER_ADMIN)
  async listMyPosts(@CurrentUser() user: any) {
    return this.postsService.listStudentMyPosts(user);
  }

  @Get('teacher-pending')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.MASTER_ADMIN)
  async listTeacherPending(@CurrentUser() user: any) {
    return this.postsService.listTeacherPendingPosts(user);
  }

  @Get('org-pending')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.MASTER_ADMIN)
  async listOrgPending(@CurrentUser() user: any) {
    return this.postsService.listOrgPendingPosts(user);
  }

  @Get('org-history')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.MASTER_ADMIN)
  async listOrgHistory(@CurrentUser() user: any) {
    return this.postsService.listOrgHistoryPosts(user);
  }

  @Get('institution-posts')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ORGANIZATION, UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listInstitutionPosts(@CurrentUser() user: any) {
    return this.postsService.listInstitutionPosts(user);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string, @Query('donorId') donorId?: string) {
    return this.postsService.getPostDetails(id, donorId);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async createPost(
    @CurrentUser() user: any,
    @Body() body: CreateStudentPostInput
  ) {
    const validated = CreateStudentPostSchema.parse(body);
    return this.postsService.createPost(user, validated);
  }

  @Post(':id/teacher-verify')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.MASTER_ADMIN)
  async teacherVerify(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('approved') approved: boolean
  ) {
    return this.postsService.teacherVerifyPost(id, user, approved);
  }

  @Post(':id/org-verify')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.MASTER_ADMIN)
  async orgVerify(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('approved') approved: boolean
  ) {
    return this.postsService.orgVerifyPost(id, user, approved);
  }

  @Post(':id/super-admin-approve')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN)
  async superAdminApprove(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @Body('rejectionReason') rejectionReason?: string,
    @Body('modifiedExpenses') modifiedExpenses?: { categoryName: string; amount: number }[],
    @Body('modificationReason') modificationReason?: string
  ) {
    return this.postsService.superAdminApprovePost(
      id,
      user,
      approved,
      rejectionReason,
      modifiedExpenses,
      modificationReason
    );
  }
}
