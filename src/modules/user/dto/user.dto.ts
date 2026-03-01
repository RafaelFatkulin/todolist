import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { roleEnum } from '../user.schema';

const RoleSchema = z.enum(roleEnum.enumValues);

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: RoleSchema.default('USER').optional(),
});

export const UpdateUserSchema = z.object({
  password: z.string().min(8).optional(),
  role: RoleSchema.optional(),
});

export const UserQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) { }
export class UpdateUserDto extends createZodDto(UpdateUserSchema) { }
export class UserQueryDto extends createZodDto(UserQuerySchema) { }
