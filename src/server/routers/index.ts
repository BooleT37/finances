import { router, publicProcedure } from '../trpc'

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: 'ok' }
  }),
})

export type AppRouter = typeof appRouter
