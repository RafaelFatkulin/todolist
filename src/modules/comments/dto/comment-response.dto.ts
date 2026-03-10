import { z } from 'zod';
import { type Comment } from '../comments.schema';

export const CommentResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  taskId: z.string(),
  authorId: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CommentResponseDto = z.infer<typeof CommentResponseSchema>;

export function toCommentResponse(
  comment: Comment & { author?: { id: string; name: string; email: string } },
): CommentResponseDto {
  return CommentResponseSchema.parse({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  });
}
