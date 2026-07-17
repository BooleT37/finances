import { createServerFn } from '@tanstack/react-start';

import { adminMiddleware } from '~/middlewares/adminMiddleware';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';

import {
  type ProjectInfo,
  type RenameProjectInput,
  renameProjectSchema,
} from './schema';

export const fetchProject = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ProjectInfo> => {
    return prisma.project.findUniqueOrThrow({
      where: { id: context.projectId },
      select: { id: true, name: true },
    });
  });

export const renameProject = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((input: RenameProjectInput) =>
    renameProjectSchema.parse(input),
  )
  .handler(async ({ data, context }): Promise<ProjectInfo> => {
    return prisma.project.update({
      where: { id: context.projectId },
      data: { name: data.name },
      select: { id: true, name: true },
    });
  });
