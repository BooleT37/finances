import { createMiddleware } from '@tanstack/react-start';

import { getSessionForRequest } from '~/server/getSessionForRequest';
import { posthog } from '~/server/posthog';

const ANONYMOUS_DISTINCT_ID = 'anonymous';

// Analytics must never take a request down with it, so a session that fails to
// resolve is reported as anonymous rather than thrown. The real failure still
// surfaces from authMiddleware, which awaits the same (memoised) lookup.
const resolveSessionUser = async () => {
  try {
    const session = await getSessionForRequest();
    return session?.user ?? null;
  } catch (error) {
    console.error('PostHog session lookup failed:', error);
    return null;
  }
};

export const posthogTrackingMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next, method, serverFnMeta, data }) => {
  const tracker = method === 'POST' ? posthog : null;
  // Resolved before the handler runs: on failure `next()` throws, discarding the
  // context that authMiddleware would otherwise have attached the user to.
  const user = tracker ? await resolveSessionUser() : null;

  const environment =
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown';
  const distinctId = user?.id ?? ANONYMOUS_DISTINCT_ID;
  const commonProps = {
    name: serverFnMeta.name,
    input: data,
    timestamp: new Date().toISOString(),
    environment,
    userEmail: user?.email ?? null,
  };

  let result: Awaited<ReturnType<typeof next>>;
  try {
    result = await next();
  } catch (error) {
    console.error(`[serverfn] ${serverFnMeta.name} failed:`, error);
    if (tracker) {
      try {
        tracker.capture({
          distinctId,
          event: `serverfn_${serverFnMeta.name}`,
          properties: {
            ...commonProps,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (phError) {
        console.error('PostHog capture failed:', phError);
      }
    }
    throw error;
  }

  if (!tracker) {
    return result;
  }
  try {
    tracker.capture({
      distinctId,
      event: `serverfn_${serverFnMeta.name}`,
      properties: { ...commonProps, success: true },
    });
  } catch (error) {
    console.error('PostHog capture failed:', error);
  }
  return result;
});
