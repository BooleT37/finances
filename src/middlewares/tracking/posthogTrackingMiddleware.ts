import { createMiddleware } from '@tanstack/react-start';
import { ZodError } from 'zod';

import { getSessionForRequest } from '~/server/getSessionForRequest';
import { posthog } from '~/server/posthog';

import { getTrackedInput } from './trackedInputs';

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

// Error messages can repeat the request's input (Prisma's do, verbatim), so
// only the error's kind is sent. The full error stays in the server log.
const describeError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { type: typeof error };
  }
  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const issues =
    error instanceof ZodError
      ? error.issues.map((issue) => ({
          path: issue.path.map(String).join('.'),
          code: issue.code,
        }))
      : undefined;
  return { type: error.name, code, issues };
};

export const posthogTrackingMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next, method, serverFnMeta }) => {
  const tracker = method === 'POST' ? posthog : null;
  // Resolved before the handler runs: on failure `next()` throws, discarding the
  // context that authMiddleware would otherwise have attached the user to.
  const user = tracker ? await resolveSessionUser() : null;

  const startedAt = performance.now();
  const environment =
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown';
  const distinctId = user?.id ?? ANONYMOUS_DISTINCT_ID;
  const commonProps = {
    name: serverFnMeta.name,
    timestamp: new Date().toISOString(),
    environment,
    // Attaches person properties so PostHog's person_display_name shows the
    // user's name/email instead of falling back to the raw distinct_id.
    ...(user && { $set: { email: user.email, name: user.name } }),
  };
  const getDurationMs = () => Math.round(performance.now() - startedAt);

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
            input: getTrackedInput(serverFnMeta.id),
            durationMs: getDurationMs(),
            success: false,
            error: describeError(error),
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
      properties: {
        ...commonProps,
        input: getTrackedInput(serverFnMeta.id),
        durationMs: getDurationMs(),
        success: true,
      },
    });
  } catch (error) {
    console.error('PostHog capture failed:', error);
  }
  return result;
});
