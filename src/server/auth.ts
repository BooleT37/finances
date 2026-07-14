import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins/admin';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

import { prisma } from '~/server/db';

const allowedHosts = process.env.BETTER_AUTH_ALLOWED_HOSTS?.split(',')
  .map((host) => host.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: allowedHosts?.length
    ? {
        allowedHosts,
        protocol: 'auto' as const,
        // For scripts (bootstrap-project.ts, reset-password.ts) we can't
        // derive baseURL from request/headers
        fallback: 'http://localhost',
      }
    : undefined,
  emailAndPassword: {
    enabled: true,
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
