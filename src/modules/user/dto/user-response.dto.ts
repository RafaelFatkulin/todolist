import { z } from 'zod';
import { type User } from '../user.schema';

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponseDto = z.infer<typeof UserResponseSchema>;

export function toUserResponse(user: User): UserResponseDto {
  return UserResponseSchema.parse(user);
}
