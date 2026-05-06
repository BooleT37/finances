import { notifications } from '@mantine/notifications';
import { createMiddleware } from '@tanstack/react-start';

import { posthog } from '~/server/posthog';

export const errorNotificationMiddleware = createMiddleware({
  type: 'function',
}).client(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error(error);
    notifications.show({
      color: 'red',
      title: 'Error',
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

// TODO: replace with the real user id once auth is in place. This matches the
// hardcoded id used in finances-t3 so events keep flowing under the same
// distinctId in the existing PostHog project. Also add `userEmail` to the
// captured properties (t3 sets it from ctx.session.user.email).
const HARDCODED_DISTINCT_ID = 'clg6kpbtn0000mr081ntz0f8i';

export const posthogTrackingMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next, method, serverFnMeta, data }) => {
  const environment =
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown';
  const commonProps = {
    name: serverFnMeta.name,
    input: data,
    timestamp: new Date().toISOString(),
    environment,
  };

  let result: Awaited<ReturnType<typeof next>>;
  try {
    result = await next();
  } catch (error) {
    console.error(`[serverfn] ${serverFnMeta.name} failed:`, error);
    if (method === 'POST' && posthog) {
      try {
        posthog.capture({
          distinctId: HARDCODED_DISTINCT_ID,
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

  if (method !== 'POST' || !posthog) {
    return result;
  }
  try {
    posthog.capture({
      distinctId: HARDCODED_DISTINCT_ID,
      event: `serverfn_${serverFnMeta.name}`,
      properties: { ...commonProps, success: true },
    });
  } catch (error) {
    console.error('PostHog capture failed:', error);
  }
  return result;
});
