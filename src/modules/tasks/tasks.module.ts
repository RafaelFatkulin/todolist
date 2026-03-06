import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, ProjectsRepository],
})
export class TasksModule { }
