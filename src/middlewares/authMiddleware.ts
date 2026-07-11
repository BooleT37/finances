import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '~/server/auth';

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

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
