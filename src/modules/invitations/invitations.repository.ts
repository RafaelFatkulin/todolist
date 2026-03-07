import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { invitations, type Invitation, type NewInvitation } from './invitations.schema';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(data: NewInvitation): Promise<Invitation> {
    const result = await this.db.db.insert(invitations).values(data).returning();
    return result[0];
  }

  async findByToken(token: string): Promise<Invitation | undefined> {
    const result = await this.db.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);
    return result[0];
  }

  async findByProjectAndEmail(projectId: string, email: string): Promise<Invitation | undefined> {
    const result = await this.db.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.projectId, projectId),
          eq(invitations.email, email),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);
    return result[0];
  }

  async findByProject(projectId: string): Promise<Invitation[]> {
    return this.db.db
      .select()
      .from(invitations)
      .where(eq(invitations.projectId, projectId));
  }

  async findByEmail(email: string): Promise<Invitation[]> {
    return this.db.db
      .select()
      .from(invitations)
      .where(eq(invitations.email, email));
  }

  async incrementUsedCount(token: string): Promise<void> {
    await this.db.db
      .update(invitations)
      .set({ usedCount: sql`${invitations.usedCount} + 1` })
      .where(eq(invitations.token, token));
  }

  async markExpired(token: string): Promise<void> {
    await this.db.db
      .update(invitations)
      .set({ status: 'expired' })
      .where(eq(invitations.token, token));
  }
}
