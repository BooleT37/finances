import { PostHog } from 'posthog-node';

const posthog =
  process.env.POSTHOG_API_KEY && process.env.NODE_ENV !== 'test'
    ? new PostHog(process.env.POSTHOG_API_KEY, {
        host: process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com',
        flushAt: 1,
        flushInterval: 3000,
      })
    : null;

export { posthog };
