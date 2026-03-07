import { integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projectMemberRole, projects } from './../projects/projects.schema';
import { users } from '../user/user.schema';
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'expired',
]);

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: 512 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  role: projectMemberRole('role').notNull().default('member'),
  status: invitationStatusEnum('status').notNull().default('pending'),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  invitedById: uuid('invited_by_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  usedCount: integer('used_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
