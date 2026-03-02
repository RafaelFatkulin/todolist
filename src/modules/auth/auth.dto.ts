import { createZodDto } from "nestjs-zod";
import z from "zod";

export const RegisterSchema = z.object({
  email: z.email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100)
})

export const LoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(100),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});


export class RegisterDto extends createZodDto(RegisterSchema) { }
export class LoginDto extends createZodDto(LoginSchema) { }
export class RefreshDto extends createZodDto(RefreshSchema) { }

export type TokensDto = z.infer<typeof TokensSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
