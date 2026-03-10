import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { UserRepository } from '../user/user.repository';
import { MailModule } from 'src/infrastructure/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MailModule, ConfigModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, ProjectsRepository, UserRepository],
})
export class TasksModule { }
// 41262842-d8da-40ad-ac51-b12357c05b99 project
// 592c0379-5501-46e2-b59c-14ff4674c0e3 task
//
// 8ad1de5a-7a21-40e1-8d4e-ea975c26f2aa - iluza
// c7ca474d-2c23-4994-9cca-144864cd0547 - test user
