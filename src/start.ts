import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import { errorNotificationMiddleware } from './middlewares/errorNotificationMiddleware';
import { posthogTrackingMiddleware } from './middlewares/posthogTrackingMiddleware';
import { serverFnLoggingMiddleware } from './middlewares/serverFnLoggingMiddleware';

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
