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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { type TaskResponseDto } from './dto/task-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type User } from '../user/user.schema';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(projectId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks in project' })
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
    @Query() query: TaskQueryDto,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.findAll(projectId, user.id, query);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task by id' })
  async findOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(projectId, user.id, taskId);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update task' })
  async update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(projectId, user.id, taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.tasksService.remove(projectId, user.id, taskId);
  }
}
