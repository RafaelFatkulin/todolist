import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { type CommentResponseDto } from './dto/comment-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type User } from '../user/user.schema';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post()
  @ApiOperation({ summary: 'Add comment to task' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(projectId, taskId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get task comments' })
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.findAll(projectId, taskId, user.id);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update comment' })
  async update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(projectId, taskId, commentId, user.id, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commentsService.remove(projectId, taskId, commentId, user.id);
  }
}
