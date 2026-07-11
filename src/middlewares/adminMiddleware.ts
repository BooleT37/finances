import { createMiddleware } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';

export const adminMiddleware = createMiddleware({ type: 'function' })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (context.role !== 'admin') {
      throw new Error('Forbidden: admin role required');
    }
    return next();
  });
