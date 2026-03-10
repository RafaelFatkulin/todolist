import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { TasksRepository } from '../tasks/tasks.repository';

@Module({
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    ProjectsRepository,
    TasksRepository,
  ],
})
export class CommentsModule { }
