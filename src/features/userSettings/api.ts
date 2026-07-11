import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';

import { userSettingSchema } from './schema';

export const fetchUserSettings = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const settings = await prisma.projectSetting.findFirst({
      where: { projectId: context.projectId },
    });
    if (!settings) {
      throw new Error('User settings not found');
    }
    return userSettingSchema.encode(settings);
  });
