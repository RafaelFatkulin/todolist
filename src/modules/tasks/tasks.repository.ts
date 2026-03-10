import { Injectable } from '@nestjs/common';
import { aliasedTable, and, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { tasks, TaskWithUsers, type NewTask, type Task } from './tasks.schema';
import { TaskQueryInput } from './dto/task.dto';
import { users } from '../user/user.schema';

type QueryResult = {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
};

@Injectable()
export class TasksRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(data: NewTask): Promise<TaskWithUsers | undefined> {
    const result = await this.db.db.insert(tasks).values(data).returning();
    const task = result[0];
    const withUsers = await this.findByIdWithUsers(task.id);
    return withUsers;
  }

  async findById(id: string): Promise<Task | undefined> {
    const result = await this.db.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return result[0];
  }

  async findByIdWithUsers(id: string): Promise<TaskWithUsers | undefined> {
    const assigneeAlias = aliasedTable(users, 'assignee_user');
    const createdByAlias = aliasedTable(users, 'created_by_user');

    const result = await this.db.db
      .select(this.buildSelectFields(assigneeAlias, createdByAlias))
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .innerJoin(createdByAlias, eq(tasks.createdById, createdByAlias.id))
      .where(eq(tasks.id, id))
      .limit(1) as QueryResult[];

    const row = result[0];
    if (!row) return undefined;
    return this.mapRowToTaskWithUsers(row);
  }

  async findByProject(projectId: string, filters: TaskQueryInput): Promise<TaskWithUsers[]> {
    const assigneeAlias = aliasedTable(users, 'assignee_user');
    const createdByAlias = aliasedTable(users, 'created_by_user');

    const conditions = [eq(tasks.projectId, projectId)];
    if (filters.status) conditions.push(eq(tasks.status, filters.status));
    if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));
    if (filters.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));

    const rows = await this.db.db
      .select(this.buildSelectFields(assigneeAlias, createdByAlias))
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .innerJoin(createdByAlias, eq(tasks.createdById, createdByAlias.id))
      .where(and(...conditions))
      .limit(filters.limit)
      .offset(filters.offset) as QueryResult[];

    return rows.map((row) => this.mapRowToTaskWithUsers(row));
  }

  async update(id: string, data: Partial<NewTask>): Promise<TaskWithUsers | undefined> {
    await this.db.db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id));

    return this.findByIdWithUsers(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(tasks).where(eq(tasks.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private buildSelectFields(
    assigneeAlias: ReturnType<typeof aliasedTable<typeof users>>,
    createdByAlias: ReturnType<typeof aliasedTable<typeof users>>,
  ) {
    return {
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      projectId: tasks.projectId,
      assigneeId: tasks.assigneeId,
      createdById: tasks.createdById,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assignee: {
        id: assigneeAlias.id,
        name: assigneeAlias.name,
        email: assigneeAlias.email,
      },
      createdBy: {
        id: createdByAlias.id,
        name: createdByAlias.name,
        email: createdByAlias.email,
      },
    };
  }

  private mapRowToTaskWithUsers(row: QueryResult): TaskWithUsers {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      projectId: row.projectId,
      assigneeId: row.assigneeId,
      createdById: row.createdById,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      assignee: row.assigneeId ? row.assignee : null,
      createdBy: row.createdBy,
    };
  }
}
