export enum MailJobName {
  AUTH_CODE = 'auth.code',
  INVITATION = 'invitation',
  VERIFY_EMAIL = 'verify.email',
  RESET_PASSWORD = 'reset.password',
  TASK_ASSIGNED = 'task.assigned',
}

export interface AuthCodeJobPayload {
  to: string
  code: string
  expiresInMinutes: number
}

export interface InvitationJobPayload {
  to: string
  invitedBy: string
  workspaceName: string
  inviteUrl: string
  expiresAt: Date
}

export interface VerifyEmailJobPayload {
  to: string;
  name: string;
  verificationUrl: string;
}

export interface ResetPasswordJobPayload {
  to: string;
  name: string;
  resetUrl: string;
}

export interface TaskAssignedJobPayload {
  to: string;
  assigneeName: string;
  taskTitle: string;
  projectName: string;
  taskUrl: string;
}

export type MailJobPayload = AuthCodeJobPayload | InvitationJobPayload | VerifyEmailJobPayload | TaskAssignedJobPayload

export const MAIL_QUEUE = 'mail';
