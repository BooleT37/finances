import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import { devStaleServerFnGuardMiddleware } from './middlewares/devStaleServerFnGuardMiddleware';
import { errorNotificationMiddleware } from './middlewares/errorNotificationMiddleware';
import { posthogTrackingMiddleware } from './middlewares/posthogTrackingMiddleware';
import { serverFnLoggingMiddleware } from './middlewares/serverFnLoggingMiddleware';

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
