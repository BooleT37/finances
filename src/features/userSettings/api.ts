import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { userSettingSchema } from './schema';

export const fetchUserSettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    const settings = await prisma.userSetting.findFirst();
    if (!settings) throw new Error('User settings not found');
    return userSettingSchema.encode(settings);
  },
);
