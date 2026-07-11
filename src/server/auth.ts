import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins/admin';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

import { prisma } from '~/server/db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Dev runs the app on different ports depending on how it's launched
  // (`npm run dev` defaults to 3002; the Claude Code preview tool uses
  // whatever port is set in .claude/launch.json, currently 3010) — trust
  // both so login doesn't break depending on which one is used.
  trustedOrigins:
    process.env.NODE_ENV === 'production'
      ? undefined
      : ['http://localhost:3002', 'http://localhost:3010'],
  emailAndPassword: {
    enabled: true,
    // Sign-up is invite-only: an admin creates accounts via the admin plugin's
    // createUser API. The public /sign-up/email endpoint must stay disabled.
    disableSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  user: {
    additionalFields: {
      // No `references` here: `Project` is a plain app model, not one Better
      // Auth manages internally — pointing `references.model` at it makes
      // Better Auth try (and fail) to resolve "project" in its own schema
      // registry. The actual FK constraint already lives in prisma/schema.prisma.
      projectId: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  plugins: [
    admin(),
    // Must run last: it intercepts Set-Cookie headers written by earlier
    // plugins/endpoints and adapts them for TanStack Start's response model.
    tanstackStartCookies(),
  ],
});
