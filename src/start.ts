import { createStart } from '@tanstack/react-start';

import { errorNotificationMiddleware } from './middleware';

export const startInstance = createStart(() => {
  return {
    functionMiddleware: [errorNotificationMiddleware],
  };
});
