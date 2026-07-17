import { createMiddleware } from '@tanstack/react-start';

import { getSessionForRequest } from '~/server/getSessionForRequest';

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getSessionForRequest();

    if (!session) {
      throw new Error('Unauthorized');
    }

    return next({
      context: {
        userId: session.user.id,
        projectId: session.user.projectId,
        role: session.user.role,
      },
    });
  },
);
