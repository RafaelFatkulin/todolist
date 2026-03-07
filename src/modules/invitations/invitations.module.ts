import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { UserRepository } from '../user/user.repository';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MailModule, ConfigModule],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationsRepository,
    ProjectsRepository,
    UserRepository,
  ],
})
export class InvitationsModule { }
