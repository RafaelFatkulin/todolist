import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { type CreateTaskInput, type UpdateTaskInput, type TaskQueryInput } from './dto/task.dto';
import { type TaskResponseDto, toTaskResponse } from './dto/task-response.dto';
import { UserRepository } from '../user/user.repository';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/infrastructure/mail/mail.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  async create(
    projectId: string,
    userId: string,
    dto: CreateTaskInput,
  ): Promise<TaskResponseDto> {
    await this.assertCanManage(projectId, userId);

    if (dto.assigneeId) {
      await this.assertProjectMember(projectId, dto.assigneeId);
    }

    const task = await this.tasksRepository.create({
      ...dto,
      projectId,
      createdById: userId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    if (!task) {
      throw new NotFoundException();
    }

    this.logger.log(`Task ${task.id} created in project ${projectId}`);

    if (dto.assigneeId && dto.assigneeId !== userId) {
      await this.sendTaskAssignedEmail(dto.assigneeId, task.id, task.title, projectId);
    }

    return toTaskResponse(task);
  }

  async findAll(
    projectId: string,
    userId: string,
    query: TaskQueryInput,
  ): Promise<TaskResponseDto[]> {
    await this.assertMember(projectId, userId);

    const tasks = await this.tasksRepository.findByProject(projectId, query);
    return tasks.map(toTaskResponse);
  }

  async findOne(
    projectId: string,
    userId: string,
    taskId: string,
  ): Promise<TaskResponseDto> {
    await this.assertMember(projectId, userId);

    const task = await this.tasksRepository.findByIdWithUsers(taskId);
    if (!task || task.projectId !== projectId) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    return toTaskResponse(task);
  }

  async update(
    projectId: string,
    userId: string,
    taskId: string,
    dto: UpdateTaskInput,
  ): Promise<TaskResponseDto> {
    await this.assertCanManage(projectId, userId);

    const task = await this.tasksRepository.findById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (dto.assigneeId) {
      await this.assertProjectMember(projectId, dto.assigneeId);
    }

    const updated = await this.tasksRepository.update(taskId, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
    if (!updated) throw new NotFoundException(`Task ${taskId} not found`);

    const assigneeChanged = dto.assigneeId && dto.assigneeId !== task.assigneeId;
    if (assigneeChanged && dto.assigneeId !== userId) {
      await this.sendTaskAssignedEmail(dto.assigneeId!, taskId, updated.title, projectId);
    }

    return toTaskResponse(updated);
  }

  async remove(
    projectId: string,
    userId: string,
    taskId: string,
  ): Promise<void> {
    await this.assertCanManage(projectId, userId);

    const task = await this.tasksRepository.findById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    await this.tasksRepository.delete(taskId);
    this.logger.log(`Task ${taskId} deleted`);
  }

  // viewer не может управлять задачами
  private async assertCanManage(projectId: string, userId: string): Promise<void> {
    const member = await this.projectsRepository.findMember(projectId, userId);
    if (!member || member.role === 'viewer') {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async assertMember(projectId: string, userId: string): Promise<void> {
    const member = await this.projectsRepository.findMember(projectId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this project');
  }

  private async assertProjectMember(projectId: string, userId: string): Promise<void> {
    const member = await this.projectsRepository.findMember(projectId, userId);
    if (!member) {
      throw new ForbiddenException('Assignee is not a member of this project');
    }
  }

  private async sendTaskAssignedEmail(
    assigneeId: string,
    taskId: string,
    taskTitle: string,
    projectId: string,
  ): Promise<void> {
    const [assignee, project] = await Promise.all([
      this.userRepository.findById(assigneeId),
      this.projectsRepository.findById(projectId),
    ]);

    if (!assignee || !project) return;

    const taskUrl = `${this.configService.get<string>('APP_URL')}/projects/${projectId}/tasks/${taskId}`;

    this.mailService
      .sendTaskAssigned({
        to: assignee.email,
        assigneeName: assignee.name ?? assignee.email,
        taskTitle,
        projectName: project.name,
        taskUrl,
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.stack : String(err);
        this.logger.error(`Failed to queue task assigned email for ${assignee.email}`, message);
      });
  }
}
