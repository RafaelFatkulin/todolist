import { z } from 'zod';
import { type Task } from '../tasks.schema';

export const TaskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  projectId: z.string(),
  assigneeId: z.string().nullable(),
  createdById: z.string(),
  dueDate: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type TaskResponseDto = z.infer<typeof TaskResponseSchema>;

export function toTaskResponse(task: Task): TaskResponseDto {
  return TaskResponseSchema.parse({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  });
}
