import { uuid } from 'drizzle-orm/pg-core';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  refreshToken: varchar('refresh_token', { length: 512 }),
  emailVerified: timestamp('email_verified'),
  verificationToken: varchar('verification_token', { length: 512 }),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at'),
  resetPasswordToken: varchar('reset_password_token', { length: 512 }),
  resetPasswordTokenExpiresAt: timestamp('reset_password_token_expires_at'),
  passwordChangedAt: timestamp('password_changed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
