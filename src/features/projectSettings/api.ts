import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';

import { projectSettingsSchema } from './schema';

export const fetchProjectSettings = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const settings = await prisma.projectSetting.findFirst({
      where: { projectId: context.projectId },
    });
    if (!settings) {
      throw new Error('Project settings not found');
    }
    return projectSettingsSchema.encode(settings);
  });
