import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done']);
const TaskPriorityEnum = z.enum(['low', 'medium', 'high']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: TaskStatusEnum.default('todo'),
  priority: TaskPriorityEnum.default('low'),
  assigneeId: z.uuid().optional(),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => v || null)
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: 'Invalid date format' }),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  assigneeId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export class CreateTaskDto extends createZodDto(CreateTaskSchema) { }
export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) { }
export class TaskQueryDto extends createZodDto(TaskQuerySchema) { }

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQueryInput = z.infer<typeof TaskQuerySchema>;
