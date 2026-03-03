import z from 'zod';
import { Project } from '../projects.schema';

export const ProjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ownerId: z.string(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const ProjectMemberResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  role: z.string(),
  createdAt: z.date().nullable(),
});

export type ProjectResponseDto = z.infer<typeof ProjectResponseSchema>;
export type ProjectMemberResponseDto = z.infer<typeof ProjectMemberResponseSchema>;

export function toProjectResponse(project: Project): ProjectResponseDto {
  return ProjectResponseSchema.parse(project);
}
