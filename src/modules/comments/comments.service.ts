import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { type CreateCommentInput, type UpdateCommentInput } from './dto/comment.dto';
import { type CommentResponseDto, toCommentResponse } from './dto/comment-response.dto';
import { TasksRepository } from '../tasks/tasks.repository';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) { }

  async create(
    projectId: string,
    taskId: string,
    userId: string,
    dto: CreateCommentInput,
  ): Promise<CommentResponseDto> {
    await this.assertMember(projectId, userId);
    await this.assertTaskExists(projectId, taskId);

    const comment = await this.commentsRepository.create({
      content: dto.content,
      taskId,
      authorId: userId,
    });

    this.logger.log(`Comment ${comment.id} created on task ${taskId}`);
    return toCommentResponse(comment);
  }

  async findAll(
    projectId: string,
    taskId: string,
    userId: string,
  ): Promise<CommentResponseDto[]> {
    await this.assertMember(projectId, userId);
    await this.assertTaskExists(projectId, taskId);

    const comments = await this.commentsRepository.findByTask(taskId);
    return comments.map(toCommentResponse);
  }

  async update(
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentInput,
  ): Promise<CommentResponseDto> {
    await this.assertMember(projectId, userId);
    await this.assertTaskExists(projectId, taskId);

    const comment = await this.commentsRepository.findByIdAndAuthor(commentId, userId);
    if (!comment) throw new ForbiddenException('You can only edit your own comments');

    const updated = await this.commentsRepository.update(commentId, dto.content);
    if (!updated) throw new NotFoundException(`Comment ${commentId} not found`);

    return toCommentResponse(updated);
  }

  async remove(
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(projectId, userId);
    await this.assertTaskExists(projectId, taskId);

    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    const isAuthor = comment.authorId === userId;
    const member = await this.projectsRepository.findMember(projectId, userId);
    const isOwner = member?.role === 'owner';

    if (!isAuthor && !isOwner) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.delete(commentId);
    this.logger.log(`Comment ${commentId} deleted`);
  }

  private async assertMember(projectId: string, userId: string): Promise<void> {
    const member = await this.projectsRepository.findMember(projectId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this project');
  }

  private async assertTaskExists(projectId: string, taskId: string): Promise<void> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
  }
}
