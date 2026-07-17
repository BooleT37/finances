import { z } from 'zod';

export interface ProjectInfo {
  id: string;
  name: string;
}

export const renameProjectSchema = z.object({
  name: z.string().min(1),
});
export type RenameProjectInput = z.input<typeof renameProjectSchema>;
