import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import {
  errorNotificationMiddleware,
  posthogTrackingMiddleware,
} from './middleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [csrfMiddleware],
    functionMiddleware: [
      errorNotificationMiddleware,
      posthogTrackingMiddleware,
    ],
  };
});
