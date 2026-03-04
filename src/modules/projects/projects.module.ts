import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { UserModule } from '../user/user.module';
import { MailModule } from 'src/infrastructure/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [UserModule, MailModule, ConfigModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule { }
