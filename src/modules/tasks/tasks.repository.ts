import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { tasks, type NewTask, type Task } from './tasks.schema';
import { TaskQueryInput } from './dto/task.dto';

@Injectable()
export class TasksRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(data: NewTask): Promise<Task> {
    const result = await this.db.db.insert(tasks).values(data).returning();
    return result[0];
  }

  async findById(id: string): Promise<Task | undefined> {
    const result = await this.db.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return result[0];
  }

  async findByProject(projectId: string, filters: TaskQueryInput): Promise<Task[]> {
    const conditions = [eq(tasks.projectId, projectId)];

    if (filters.status) conditions.push(eq(tasks.status, filters.status));
    if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));
    if (filters.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));

    return this.db.db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async update(id: string, data: Partial<NewTask>): Promise<Task | undefined> {
    const result = await this.db.db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(tasks).where(eq(tasks.id, id));
  }
}
