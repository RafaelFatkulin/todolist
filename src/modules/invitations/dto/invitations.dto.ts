import { createZodDto } from 'nestjs-zod';
import { ProjectMemberRoleSchema } from 'src/modules/projects/dto/project.dto';
import z from 'zod';

export const CreateInvitationSchema = z.object({
  email: z.email(),
  role: ProjectMemberRoleSchema,
});

export class CreateInvitationDto extends createZodDto(CreateInvitationSchema) { }

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
