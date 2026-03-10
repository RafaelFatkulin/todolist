import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export class CreateCommentDto extends createZodDto(CreateCommentSchema) { }
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) { }

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>
