import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InvitationsRepository } from './invitations.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { MailService } from '../../infrastructure/mail/mail.service';
import { UserRepository } from '../user/user.repository';
import { type Invitation } from './invitations.schema';
import { CreateInvitationInput } from './dto/invitations.dto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  async invite(
    projectId: string,
    requesterId: string,
    dto: CreateInvitationInput,
  ): Promise<{ message: string }> {
    const requesterMember = await this.projectsRepository.findMember(projectId, requesterId);
    if (!requesterMember || requesterMember.role !== 'owner') {
      throw new ForbiddenException('Only project owner can invite members');
    }

    const project = await this.projectsRepository.findById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // проверяем нет ли уже pending инвайта на этот email
    const existingInvite = await this.invitationsRepository.findByProjectAndEmail(
      projectId,
      dto.email,
    );
    if (existingInvite) throw new ConflictException('Invitation already sent to this email');

    // если пользователь уже существует — проверяем членство
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      const existingMember = await this.projectsRepository.findMember(projectId, existingUser.id);
      if (existingMember) throw new ConflictException('User is already a member of this project');
    }

    const requester = await this.userRepository.findById(requesterId);
    if (!requester) throw new NotFoundException('Requester not found');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.invitationsRepository.create({
      token,
      email: dto.email,
      role: dto.role,
      projectId,
      invitedById: requesterId,
      expiresAt,
    });

    const inviteUrl = `${this.configService.getOrThrow<string>('APP_URL')}/invitations/accept?token=${token}`;

    this.mailService
      .sendInvitation({
        to: dto.email,
        invitedBy: requester.name ?? requester.email,
        workspaceName: project.name,
        inviteUrl,
        expiresAt,
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.stack : String(err);
        this.logger.error(`Failed to queue invitation email for ${dto.email}`, message);
      });

    this.logger.log(`Invitation sent to ${dto.email} for project ${projectId}`);
    return { message: 'Invitation sent successfully' };
  }

  // Публичный эндпоинт — возвращает мета-информацию об инвайте без авторизации
  async getInvitationInfo(token: string): Promise<{
    email: string;
    projectName: string;
    role: string;
    expiresAt: Date;
    requiresRegistration: boolean;
  }> {
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) throw new NotFoundException('Invalid invitation token');

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      await this.invitationsRepository.markExpired(token);
      throw new GoneException('Invitation has expired');
    }

    const project = await this.projectsRepository.findById(invitation.projectId);
    if (!project) throw new NotFoundException('Project not found');

    const existingUser = await this.userRepository.findByEmail(invitation.email);

    return {
      email: invitation.email,
      projectName: project.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      requiresRegistration: !existingUser, // фронт редиректит на регистрацию
    };
  }

  // Вызывается после регистрации/логина — принимает инвайт
  async accept(token: string, userId: string): Promise<{ message: string }> {
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) throw new NotFoundException('Invalid invitation token');

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      await this.invitationsRepository.markExpired(token);
      throw new GoneException('Invitation has expired');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // email пользователя должен совпадать с email инвайта
    if (user.email !== invitation.email) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    const existingMember = await this.projectsRepository.findMember(
      invitation.projectId,
      userId,
    );
    if (existingMember) throw new ConflictException('You are already a member of this project');

    await this.projectsRepository.addMember(invitation.projectId, userId, invitation.role);
    await this.invitationsRepository.incrementUsedCount(token);
    // статус остаётся pending — ссылка многоразовая

    this.logger.log(`User ${userId} accepted invitation to project ${invitation.projectId}`);
    return { message: 'Invitation accepted successfully' };
  }

  async getByProject(projectId: string, requesterId: string): Promise<Invitation[]> {
    const member = await this.projectsRepository.findMember(projectId, requesterId);
    if (!member) throw new ForbiddenException('You are not a member of this project');

    return this.invitationsRepository.findByProject(projectId);
  }
}
