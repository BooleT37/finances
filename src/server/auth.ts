import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins/admin';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

import { prisma } from '~/server/db';

// Escape hatch for any environment with more than one valid host: every
// Vercel Preview branch/PR deployment gets a unique *.vercel.app hostname
// (a static BETTER_AUTH_URL would only ever match one of them), and locally
// the app runs on different ports depending on how it's launched (`npm run
// dev` defaults to 3002; the Claude Code preview tool uses whatever port is
// set in .claude/launch.json, currently 3010). Set BETTER_AUTH_ALLOWED_HOSTS
// (comma-separated host patterns, wildcards allowed — e.g. "*.vercel.app" or
// "localhost:3002,localhost:3010") to derive the base URL from each incoming
// request's host instead, validated against this allowlist. `protocol:
// 'auto'` reads the actual request's own scheme first and falls back to
// preferring http for loopback hosts (localhost/127.*/::1), so the same
// config correctly derives https for Preview and http for local — see
// getProtocolFromSource in better-auth's url utils. This also auto-populates
// trustedOrigins with the same host patterns (see getTrustedOrigins in
// better-auth's context helpers), so no separate trustedOrigins entry is
// needed. Leave this unset on Production: it should use a fixed, known
// origin via a plain BETTER_AUTH_URL string instead, not a wildcard.
const allowedHosts = process.env.BETTER_AUTH_ALLOWED_HOSTS?.split(',')
  .map((host) => host.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    allowedHosts && allowedHosts.length > 0
      ? { allowedHosts, protocol: 'auto' as const }
      : process.env.BETTER_AUTH_URL,
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
