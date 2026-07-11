import { z } from 'zod';

export interface ProjectUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const createProjectUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']),
});
export type CreateProjectUserInput = z.input<typeof createProjectUserSchema>;

export const resetProjectUserPasswordSchema = z.object({
  userId: z.string(),
  password: z.string().min(8),
});
export type ResetProjectUserPasswordInput = z.input<
  typeof resetProjectUserPasswordSchema
>;
