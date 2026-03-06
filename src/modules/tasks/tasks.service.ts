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

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectsRepository: ProjectsRepository,
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

    this.logger.log(`Task ${task.id} created in project ${projectId}`);
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

    const task = await this.tasksRepository.findById(taskId);
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
}
