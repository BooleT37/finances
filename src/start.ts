import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import {
  errorNotificationMiddleware,
  posthogTrackingMiddleware,
  serverFnLoggingMiddleware,
} from './middleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [csrfMiddleware],
    functionMiddleware: [
      serverFnLoggingMiddleware,
      errorNotificationMiddleware,
      posthogTrackingMiddleware,
    ],
  };
});
