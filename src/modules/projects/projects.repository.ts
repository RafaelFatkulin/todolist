import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  projects,
  projectMembers,
  type Project,
  type NewProject,
  UpdateProject,
  ProjectMember,
  ProjectMemberRole,
} from './projects.schema';
import { users } from '../user/user.schema';

export type ProjectMemberWithUser = {
  id: string;
  projectId: string;
  role: 'member' | 'viewer' | 'owner';
  createdAt: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

@Injectable()
export class ProjectsRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(data: NewProject): Promise<Project> {
    const result = await this.db.db
      .insert(projects)
      .values(data)
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<Project | undefined> {
    const result = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return result[0];
  }

  async findByUser(userId: string): Promise<Project[]> {
    const members = await this.db.db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const projectIds = members.map((m) => m.projectId);
    if (projectIds.length === 0) return [];

    return this.db.db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, userId));
  }

  async update(id: string, data: UpdateProject): Promise<Project | undefined> {
    const result = await this.db.db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.db
      .delete(projects)
      .where(eq(projects.id, id));
  }

  async addMember(
    projectId: string,
    userId: string,
    role: ProjectMemberRole = 'member',
  ): Promise<ProjectMember> {
    const result = await this.db.db
      .insert(projectMembers)
      .values({ projectId, userId, role })
      .returning();
    return result[0];
  }

  async findMember(projectId: string, userId: string): Promise<ProjectMember | undefined> {
    const result = await this.db.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      )
      .limit(1);
    return result[0];
  }

  async findMemberWithUser(projectId: string, userId: string): Promise<ProjectMemberWithUser | undefined> {
    const result = await this.db.db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      )
      .limit(1);

    return result[0];
  }

  async findMembers(projectId: string): Promise<ProjectMemberWithUser[]> {
    return this.db.db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: 'member' | 'viewer' | 'owner',
  ): Promise<ProjectMemberWithUser | undefined> {
    await this.db.db
      .update(projectMembers)
      .set({ role })
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      );

    return this.findMemberWithUser(projectId, userId);
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.db.db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      );
  }
}
