import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from '../user/user.schema';
import { pgEnum } from 'drizzle-orm/pg-core';
import { projects } from '../projects/projects.schema';

export const taskStatus = pgEnum('task_status', ['todo', 'in_progress', 'done']);
export const taskPriority = pgEnum('task_priority', ['low', 'medium', 'high']);

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: taskStatus('status').default('todo').notNull(),
  priority: taskPriority('priority').default('medium').notNull(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskStatus = typeof taskStatus.enumValues[number];
export type TaskPriority = typeof taskPriority.enumValues[number];
