import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const ProjectMemberRoleSchema = z.enum(['member', 'owner', 'viewer']);

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(255),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const AddMemberSchema = z.object({
  userId: z.uuid(),
  role: ProjectMemberRoleSchema.default('member'),
});

export const UpdateMemberRoleSchema = z.object({
  role: ProjectMemberRoleSchema,
});

export class CreateProjectDto extends createZodDto(CreateProjectSchema) { }
export class UpdateProjectDto extends createZodDto(UpdateProjectSchema) { }
export class AddMemberDto extends createZodDto(AddMemberSchema) { }
export class UpdateMemberRoleDto extends createZodDto(UpdateMemberRoleSchema) { }

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type AddMemberInput = z.infer<typeof AddMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>
