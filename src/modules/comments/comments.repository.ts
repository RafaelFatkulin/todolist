import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { comments, type NewComment, type Comment, CommentWithAuthor } from './comments.schema';
import { users } from '../user/user.schema';

@Injectable()
export class CommentsRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(data: NewComment): Promise<CommentWithAuthor> {
    const result = await this.db.db
      .insert(comments)
      .values(data)
      .returning();

    const comment = result[0];
    return this.findByIdWithAuthor(comment.id) as Promise<CommentWithAuthor>;
  }

  async findByTask(taskId: string): Promise<CommentWithAuthor[]> {
    return this.db.db
      .select({
        id: comments.id,
        content: comments.content,
        taskId: comments.taskId,
        authorId: comments.authorId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.taskId, taskId));
  }

  async findByIdWithAuthor(id: string): Promise<CommentWithAuthor | undefined> {
    const result = await this.db.db
      .select({
        id: comments.id,
        content: comments.content,
        taskId: comments.taskId,
        authorId: comments.authorId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, id))
      .limit(1);

    return result[0];
  }

  async findById(id: string): Promise<Comment | undefined> {
    const result = await this.db.db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    return result[0];
  }

  async update(id: string, content: string): Promise<CommentWithAuthor | undefined> {
    await this.db.db
      .update(comments)
      .set({ content })
      .where(eq(comments.id, id));

    return this.findByIdWithAuthor(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.db
      .delete(comments)
      .where(eq(comments.id, id));
  }

  async findByIdAndAuthor(id: string, authorId: string): Promise<Comment | undefined> {
    const result = await this.db.db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), eq(comments.authorId, authorId)))
      .limit(1);
    return result[0];
  }
}
