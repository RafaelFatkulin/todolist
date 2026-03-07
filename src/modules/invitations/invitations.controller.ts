import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type User } from '../user/user.schema';
import { Public } from 'src/common/decorators/public.decorator';
import { type Invitation } from './invitations.schema';
import { CreateInvitationDto } from './dto/invitations.dto';

@ApiTags('invitations')
@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) { }

  @ApiBearerAuth()
  @Post('projects/:projectId/invitations')
  @ApiOperation({ summary: 'Invite user to project' })
  async invite(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateInvitationDto,
  ): Promise<{ message: string }> {
    return this.invitationsService.invite(projectId, user.id, dto);
  }

  // Публичный — фронт показывает инфо об инвайте до логина/регистрации
  @Public()
  @Get('invitations/info')
  @ApiOperation({ summary: 'Get invitation info by token (public)' })
  async getInfo(
    @Query('token') token: string,
  ): Promise<{
    email: string;
    projectName: string;
    role: string;
    expiresAt: Date;
    requiresRegistration: boolean;
  }> {
    return this.invitationsService.getInvitationInfo(token);
  }

  // Требует авторизации — пользователь уже залогинен или только что зарегистрировался
  @ApiBearerAuth()
  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation (requires auth)' })
  async accept(
    @Query('token') token: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.invitationsService.accept(token, user.id);
  }

  @ApiBearerAuth()
  @Get('projects/:projectId/invitations')
  @ApiOperation({ summary: 'Get project invitations' })
  async getByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
  ): Promise<Invitation[]> {
    return this.invitationsService.getByProject(projectId, user.id);
  }
}

// **Флоу для фронта:**
//
// 1. GET / invitations / info ? token = xxx        ← публичный, без авторизации
//    → { requiresRegistration: true / false, email, projectName }
//
// 2a.requiresRegistration = true
//     → редирект на / register ? inviteToken = xxx
//     → после регистрации: POST / invitations / accept ? token = xxx
//
// 2b.requiresRegistration = false
//     → редирект на / login ? inviteToken = xxx
//     → после логина: POST / invitations / accept ? token = xxx
