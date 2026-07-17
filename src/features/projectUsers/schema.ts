import { z } from 'zod';

export interface ProjectUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// The generated temporary password is only ever returned here, once, right
// after creation — it's never stored in plaintext and never retrievable again.
export interface CreatedProjectUser extends ProjectUser {
  password: string;
}

export const createProjectUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
});
export type CreateProjectUserInput = z.input<typeof createProjectUserSchema>;
