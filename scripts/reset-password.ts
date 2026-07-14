/**
 * Reset any user's password directly, on any environment. Useful when an
 * account is locked out (e.g. a corrupted password from a buggy prompt) and
 * there's no other admin who can log in to use the in-app reset-password UI.
 *
 * Bypasses Better Auth's admin API on purpose: `auth.api.setUserPassword`
 * requires an authenticated admin session (see `use: [adminMiddleware]` in
 * better-auth's admin plugin routes) with no escape hatch for headerless
 * script calls, unlike `auth.api.createUser`. Instead this hashes the
 * password with Better Auth's own default hasher (`better-auth/crypto`'s
 * `hashPassword` — the same one sign-in verifies against) and writes
 * directly to the Account/User tables via Prisma, mirroring exactly what
 * that endpoint does internally.
 *
 * Usage: npx tsx scripts/reset-password.ts <local|dev|prod>
 */
import { createInterface } from 'node:readline/promises';

import 'dotenv/config';
import { hashPassword } from 'better-auth/crypto';

const ENV_DATABASE_URLS: Record<string, string | undefined> = {
  local: process.env.DATABASE_URL,
  // Never commit real values here even though this file is gitignored;
  // export DEV_DATABASE_URL/PROD_DATABASE_URL in your shell before running.
  dev: process.env.DEV_DATABASE_URL,
  prod: process.env.PROD_DATABASE_URL,
};

const KEY_LF = 0x0a;
const KEY_CR = 0x0d;
const KEY_EOF = 0x04;
const KEY_INTERRUPT = 0x03;
const KEY_BACKSPACE = 0x08;
const KEY_DELETE = 0x7f;

// zsh enables bracketed paste mode at its own prompt by default, and that
// terminal-level setting persists when this process takes over stdin. Without
// disabling it here, a pasted (Cmd+V) password arrives wrapped in escape
// sequences (ESC[200~...ESC[201~) that get appended into the captured input
// as literal bytes, silently corrupting the password that gets hashed.
const DISABLE_BRACKETED_PASTE = '\x1b[?2004l';
const ENABLE_BRACKETED_PASTE = '\x1b[?2004h';

function readHidden(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(DISABLE_BRACKETED_PASTE);
    process.stdout.write(promptText);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let input = '';
    const onData = (buf: Buffer) => {
      const code = buf[0];
      if (code === undefined) return;
      if (code === KEY_LF || code === KEY_CR || code === KEY_EOF) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write(ENABLE_BRACKETED_PASTE);
        process.stdout.write('\n');
        resolve(input);
      } else if (code === KEY_INTERRUPT) {
        process.stdout.write(ENABLE_BRACKETED_PASTE);
        process.stdout.write('\n');
        process.exit(1);
      } else if (code === KEY_BACKSPACE || code === KEY_DELETE) {
        input = input.slice(0, -1);
      } else {
        input += buf.toString('utf8');
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const env = process.argv[2];
  if (!env || !(env in ENV_DATABASE_URLS)) {
    console.error('Usage: npx tsx scripts/reset-password.ts <local|dev|prod>');
    process.exit(1);
  }

  const databaseUrl = ENV_DATABASE_URLS[env];
  if (!databaseUrl) {
    console.error(
      `No DATABASE_URL resolved for env "${env}". For "dev"/"prod", export DEV_DATABASE_URL/PROD_DATABASE_URL first.`,
    );
    process.exit(1);
  }
  process.env.DATABASE_URL = databaseUrl;

  const { prisma } = await import('../src/server/db');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = await rl.question('Email of account to reset: ');
  rl.close();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}" in ${env}.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(
    `Found user: ${user.name} <${user.email}> (id: ${user.id}, role: ${user.role})`,
  );

  const password = await readHidden('New password: ');
  const confirmPassword = await readHidden('Confirm new password: ');
  if (password !== confirmPassword) {
    console.error('Passwords did not match — nothing was changed.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);
  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  });
  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: 'credential',
        accountId: user.id,
        password: hashedPassword,
      },
    });
  }

  console.log(`Password reset for ${user.email} on ${env}.`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
