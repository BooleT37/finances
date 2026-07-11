import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '~/server/auth';

export interface SessionUser {
  userId: string;
  projectId: string;
  role: string;
  email: string;
  name: string;
}

export const fetchSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return null;
    }
    return {
      userId: session.user.id,
      projectId: session.user.projectId,
      role: session.user.role ?? 'user',
      email: session.user.email,
      name: session.user.name,
    };
  },
);
