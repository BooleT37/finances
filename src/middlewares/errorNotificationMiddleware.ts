import { notifications } from '@mantine/notifications';
import { createMiddleware } from '@tanstack/react-start';

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
