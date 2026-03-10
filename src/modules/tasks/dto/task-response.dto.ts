import { z } from 'zod';
import { TaskWithUsers } from '../tasks.schema';
import { UserShortSchema } from 'src/modules/user/dto/user-response.dto';

export const TaskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  projectId: z.string(),
  assigneeId: z.string().nullable(),
  assignee: UserShortSchema.nullable(),
  createdById: z.string(),
  createdBy: UserShortSchema,
  dueDate: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type TaskResponseDto = z.infer<typeof TaskResponseSchema>;

export function toTaskResponse(task: TaskWithUsers): TaskResponseDto {
  return TaskResponseSchema.parse({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  });
}
