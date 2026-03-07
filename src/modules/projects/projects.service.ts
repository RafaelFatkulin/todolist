import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import {
  type CreateProjectInput,
  type UpdateProjectInput,
} from './dto/project.dto';
import {
  type ProjectResponseDto,
  type ProjectMemberResponseDto,
  toProjectResponse,
  ProjectMemberResponseSchema,
} from './dto/project-response.dto';
import { UserRepository } from '../user/user.repository';
import { MailService } from '../../infrastructure/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  async create(userId: string, dto: CreateProjectInput): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.create({
      ...dto,
      ownerId: userId,
    });

    await this.projectsRepository.addMember(project.id, userId, 'owner');

    this.logger.log(`Project created: ${project.id} by user: ${userId}`);
    return toProjectResponse(project);
  }

  async findAllByUser(userId: string): Promise<ProjectResponseDto[]> {
    const list = await this.projectsRepository.findByUser(userId);
    return list.map(toProjectResponse);
  }

  async findOne(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findById(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    await this.assertMember(id, userId);
    return toProjectResponse(project);
  }

  async update(id: string, userId: string, dto: UpdateProjectInput): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findById(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    await this.assertOwnerOrRole(id, userId, ['owner']);

    const updated = await this.projectsRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`Project ${id} not found`);

    return toProjectResponse(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.projectsRepository.findById(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    if (project.ownerId !== userId) throw new ForbiddenException('Only owner can delete project');

    await this.projectsRepository.delete(id);
    this.logger.log(`Project deleted: ${id}`);
  }

  async getMembers(projectId: string, userId: string): Promise<ProjectMemberResponseDto[]> {
    await this.assertMember(projectId, userId);
    const members = await this.projectsRepository.findMembers(projectId);
    return members.map((m) => ProjectMemberResponseSchema.parse(m));
  }

  async updateMemberRole(
    projectId: string,
    requesterId: string,
    targetUserId: string,
    role: 'member' | 'viewer' | 'owner',
  ): Promise<ProjectMemberResponseDto> {
    await this.assertOwnerOrRole(projectId, requesterId, ['owner']);

    const updated = await this.projectsRepository.updateMemberRole(projectId, targetUserId, role);
    if (!updated) throw new NotFoundException('Member not found');

    return ProjectMemberResponseSchema.parse(updated);
  }

  async removeMember(projectId: string, requesterId: string, targetUserId: string): Promise<void> {
    await this.assertOwnerOrRole(projectId, requesterId, ['owner']);
    await this.projectsRepository.removeMember(projectId, targetUserId);
  }

  private async assertMember(projectId: string, userId: string): Promise<void> {
    const member = await this.projectsRepository.findMember(projectId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this project');
  }

  private async assertOwnerOrRole(
    projectId: string,
    userId: string,
    roles: Array<'member' | 'viewer' | 'owner'>,
  ): Promise<void> {
    const member = await this.projectsRepository.findMember(projectId, userId);
    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
