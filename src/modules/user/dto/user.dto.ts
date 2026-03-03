import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
});

export const UpdateUserSchema = z.object({
  password: z.string().min(8).optional(),
  name: z.string().min(2).max(100).optional(),
  refreshToken: z.string().nullable().optional(),
});

export const UserQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) { }
export class UpdateUserDto extends createZodDto(UpdateUserSchema) { }
export class UserQueryDto extends createZodDto(UserQuerySchema) { }
