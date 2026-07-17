import { getRequest } from '@tanstack/react-start/server';

import { auth } from '~/server/auth';

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

// The global posthogTrackingMiddleware and the per-function authMiddleware both
// need the session, and the global one runs outside the other, so it cannot read
// its context. Memoising per request keeps that from costing a second lookup.
const sessionByRequest = new WeakMap<Request, Promise<SessionResult>>();

export const getSessionForRequest = (): Promise<SessionResult> => {
  const request = getRequest();
  const cached = sessionByRequest.get(request);
  if (cached) {
    return cached;
  }

  const session = auth.api.getSession({ headers: request.headers });
  sessionByRequest.set(request, session);
  return session;
};
