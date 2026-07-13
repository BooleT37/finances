import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, testUtils } from 'better-auth/plugins';

import { TEST_BASE_URL, TEST_BETTER_AUTH_SECRET, testPrisma } from './client';

// Separate test-only Better Auth instance (per Better Auth's own testUtils
// docs) so `ctx.test` stays typed without adding the plugin to the real
// src/server/auth.ts config. Must share TEST_BETTER_AUTH_SECRET with the
// webServer's instance so cookies minted here validate against it.
//
// Mirrors src/server/auth.ts's emailAndPassword/admin/additionalFields setup
// (minus socialProviders/tanstackStartCookies, not needed for seeding) so
// `testUtils`-created sessions and `admin.createUser`-created password
// accounts both behave like the real app's.
export const testAuth = betterAuth({
  database: prismaAdapter(testPrisma, { provider: 'postgresql' }),
  secret: TEST_BETTER_AUTH_SECRET,
  baseURL: TEST_BASE_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      projectId: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  plugins: [admin(), testUtils()],
});
