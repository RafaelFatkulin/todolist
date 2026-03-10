import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AuthCodeJobPayload, InvitationJobPayload, MAIL_QUEUE, MailJobName, ResetPasswordJobPayload, TaskAssignedJobPayload, VerifyEmailJobPayload } from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) { }

  async sendVerificationEmail(payload: VerifyEmailJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.VERIFY_EMAIL, payload, {
      priority: 1,
    });
    this.logger.log(`Verification email job queued for ${payload.to}`);
  }

  async sendResetPassword(payload: ResetPasswordJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.RESET_PASSWORD, payload, {
      priority: 1,
    });
    this.logger.log(`Reset password job queued for ${payload.to}`);
  }

  async sendAuthCode(payload: AuthCodeJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.AUTH_CODE, payload, {
      priority: 2,
    });
    this.logger.log(`Auth code job queued for ${payload.to}`);
  }

  async sendInvitation(payload: InvitationJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.INVITATION, payload, {
      priority: 3,
    });
    this.logger.log(`Invitation job queued for ${payload.to}`);
  }

  async sendTaskAssigned(payload: TaskAssignedJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.TASK_ASSIGNED, payload, {
      priority: 2,
    });
    this.logger.log(`Task assigned job queued for ${payload.to}`);
  }
}
