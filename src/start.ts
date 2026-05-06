import { createStart } from '@tanstack/react-start';

import {
  errorNotificationMiddleware,
  posthogTrackingMiddleware,
} from './middleware';

export const startInstance = createStart(() => {
  return {
    functionMiddleware: [
      errorNotificationMiddleware,
      posthogTrackingMiddleware,
    ],
  };
});
