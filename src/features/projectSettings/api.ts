import { createServerFn } from '@tanstack/react-start';

import { adminMiddleware } from '~/middlewares/adminMiddleware';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { trackInput } from '~/middlewares/tracking/trackInput';
import { prisma } from '~/server/db';

import {
  projectSettingsSchema,
  type SetCategorySuggestionsEnabledInput,
  setCategorySuggestionsEnabledSchema,
} from './schema';

export const fetchProjectSettings = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const settings = await prisma.projectSetting.findFirst({
      where: { projectId: context.projectId },
    });
    if (!settings) {
      throw new Error('Project settings not found');
    }
    return projectSettingsSchema.encode({
      ...settings,
      categorySuggestionsEnabled:
        settings.categorySuggestionsEnabledAt !== null,
    });
  });

export const setCategorySuggestionsEnabled = createServerFn({
  method: 'POST',
})
  .middleware([
    adminMiddleware,
    trackInput<SetCategorySuggestionsEnabledInput>(),
  ])
  .inputValidator((input: SetCategorySuggestionsEnabledInput) =>
    setCategorySuggestionsEnabledSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await prisma.projectSetting.update({
      where: { projectId: context.projectId },
      data: {
        categorySuggestionsEnabledAt: data.enabled ? new Date() : null,
      },
    });
  });
