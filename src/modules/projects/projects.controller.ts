import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateMemberRoleDto,
} from './dto/project.dto';
import { type ProjectResponseDto, type ProjectMemberResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type User } from '../user/user.schema';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my projects' })
  async findAll(@CurrentUser() user: User): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.projectsService.remove(id, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  async getMembers(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ProjectMemberResponseDto[]> {
    return this.projectsService.getMembers(id, user.id);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<ProjectMemberResponseDto> {
    return this.projectsService.updateMemberRole(id, user.id, userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from project' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.projectsService.removeMember(id, user.id, userId);
  }
}
