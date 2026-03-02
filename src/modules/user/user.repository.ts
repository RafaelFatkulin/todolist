import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { NewUser, User, users } from './user.schema';

@Injectable()
export class UserRepository {
  constructor(private readonly db: DatabaseService) { }

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.db
      .insert(users)
      .values(data)
      .returning();
    return result[0];
  }

  async update(id: string, data: Partial<Pick<NewUser, 'passwordHash' | 'refreshToken'>>): Promise<User | undefined> {
    const result = await this.db.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async findAll(limit = 20, offset = 0): Promise<User[]> {
    return this.db.db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.db
      .delete(users)
      .where(eq(users.id, id));
  }
}
