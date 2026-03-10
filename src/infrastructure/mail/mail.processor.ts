import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AuthCodeJobPayload, InvitationJobPayload, MAIL_QUEUE, MailJobName, ResetPasswordJobPayload, TaskAssignedJobPayload, VerifyEmailJobPayload } from './mail.types';

@Processor(MAIL_QUEUE, {
  concurrency: 5,
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing job ${job.id} [${job.name}]`);

    const jobName = job.name as MailJobName;
    switch (jobName) {
      case MailJobName.VERIFY_EMAIL:
        return this.handleVerifyEmail(job as Job<VerifyEmailJobPayload>);
      case MailJobName.RESET_PASSWORD:
        return this.handleResetPassword(job as Job<ResetPasswordJobPayload>);
      case MailJobName.AUTH_CODE:
        return this.handleAuthCode(job as Job<AuthCodeJobPayload>);
      case MailJobName.INVITATION:
        return this.handleInvitation(job as Job<InvitationJobPayload>);
      case MailJobName.TASK_ASSIGNED:
        return this.handleTaskAssigned(job as Job<TaskAssignedJobPayload>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleVerifyEmail(job: Job<VerifyEmailJobPayload>): Promise<void> {
    const { to, name, verificationUrl } = job.data;
    await this.mailerService.sendMail({
      to,
      subject: 'Подтвердите email',
      template: 'verify-email',
      context: { name, verificationUrl },
    });
  }

  private async handleResetPassword(job: Job<ResetPasswordJobPayload>): Promise<void> {
    const { to, name, resetUrl } = job.data;
    await this.mailerService.sendMail({
      to,
      subject: 'Сброс пароля',
      template: 'reset-password',
      context: { name, resetUrl },
    });
  }

  private async handleAuthCode(job: Job<AuthCodeJobPayload>): Promise<void> {
    const { to, code, expiresInMinutes } = job.data;

    await this.mailerService.sendMail({
      to,
      subject: 'Код подтверждения',
      template: 'auth-code',
      context: { code, expiresInMinutes },
    });
  }

  private async handleInvitation(job: Job<InvitationJobPayload>): Promise<void> {
    const { to, invitedBy, workspaceName, inviteUrl, expiresAt } = job.data;

    await this.mailerService.sendMail({
      to,
      subject: `Приглашение в ${workspaceName}`,
      template: 'invitation',
      context: {
        invitedBy,
        workspaceName,
        inviteUrl,
        expiresAt: new Date(expiresAt).toLocaleDateString('ru-RU'),
      },
    });
  }

  private async handleTaskAssigned(job: Job<TaskAssignedJobPayload>): Promise<void> {
    const { to, assigneeName, taskTitle, projectName, taskUrl } = job.data;
    await this.mailerService.sendMail({
      to,
      subject: `Вам назначена задача: ${taskTitle}`,
      template: 'task-assigned',
      context: { assigneeName, taskTitle, projectName, taskUrl },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} [${job.name}] completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job ${job.id} [${job.name}] failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }
}
