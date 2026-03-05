export enum MailJobName {
  AUTH_CODE = 'auth.code',
  INVITATION = 'invitation',
  WELCOME = 'welcome',
  VERIFY_EMAIL = 'verify.email'
}

export interface WelcomeJobPayload {
  to: string;
  name: string;
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

export type MailJobPayload = AuthCodeJobPayload | InvitationJobPayload | WelcomeJobPayload | VerifyEmailJobPayload

export const MAIL_QUEUE = 'mail';
