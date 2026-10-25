import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import { devStaleServerFnGuardMiddleware } from './middlewares/devStaleServerFnGuardMiddleware';
import { errorNotificationMiddleware } from './middlewares/errorNotificationMiddleware';
import { serverFnLoggingMiddleware } from './middlewares/serverFnLoggingMiddleware';
import { posthogTrackingMiddleware } from './middlewares/tracking/posthogTrackingMiddleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [devStaleServerFnGuardMiddleware, csrfMiddleware],
    functionMiddleware: [
      serverFnLoggingMiddleware,
      errorNotificationMiddleware,
      posthogTrackingMiddleware,
    ],
  };
});
