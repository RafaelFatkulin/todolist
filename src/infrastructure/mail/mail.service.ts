import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AuthCodeJobPayload, InvitationJobPayload, MAIL_QUEUE, MailJobName, WelcomeJobPayload } from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) { }

  async sendWelcome(payload: WelcomeJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.WELCOME, payload, {
      priority: 3,
    });
    this.logger.log(`Welcome job queued for ${payload.to}`);
  }

  async sendAuthCode(payload: AuthCodeJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.AUTH_CODE, payload, {
      priority: 1,
    });
    this.logger.log(`Auth code job queued for ${payload.to}`);
  }

  async sendInvitation(payload: InvitationJobPayload): Promise<void> {
    await this.mailQueue.add(MailJobName.INVITATION, payload, {
      priority: 2,
    });
    this.logger.log(`Invitation job queued for ${payload.to}`);
  }
}
