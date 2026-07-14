/**
 * Creates a fresh Project + first admin User + ProjectSetting + system
 * categories for a given environment. Reusable — not a one-shot script.
 *
 * Usage: npx tsx scripts/bootstrap-project.ts <local|dev|prod>
 */
import { createInterface } from 'node:readline/promises';

import 'dotenv/config';

const ENV_DATABASE_URLS: Record<string, string | undefined> = {
  local: process.env.DATABASE_URL,
  // Fill in once available — never commit real values here even though this
  // file is gitignored; prefer exporting DEV_DATABASE_URL/PROD_DATABASE_URL
  // in your shell before running against those environments.
  dev: process.env.DEV_DATABASE_URL,
  prod: process.env.PROD_DATABASE_URL,
};

const KEY_LF = 0x0a;
const KEY_CR = 0x0d;
const KEY_EOF = 0x04;
const KEY_INTERRUPT = 0x03;
const KEY_BACKSPACE = 0x08;
const KEY_DELETE = 0x7f;

function readHidden(promptText: string): Promise<string> {
  return new Promise((resolve) => {
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
        process.stdout.write('\n');
        resolve(input);
      } else if (code === KEY_INTERRUPT) {
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

const SYSTEM_CATEGORIES = [
  {
    name: 'Из сбережений',
    shortname: 'Из сбережений',
    isIncome: false,
    isContinuous: false,
    type: 'FROM_SAVINGS' as const,
  },
  {
    name: 'В сбережения',
    shortname: 'В сбережения',
    isIncome: false,
    isContinuous: false,
    type: 'TO_SAVINGS' as const,
  },
  {
    name: 'Зарплата',
    shortname: 'Зарплата',
    isIncome: true,
    isContinuous: false,
    type: null,
  },
];

async function main() {
  const env = process.argv[2];
  if (!env || !(env in ENV_DATABASE_URLS)) {
    console.error('Usage: npx tsx scripts/bootstrap-project.ts <local|dev|prod>');
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

  // Import after DATABASE_URL is set, since the prisma singleton reads it at
  // module load time.
  const { prisma } = await import('../src/server/db');
  const { auth } = await import('../src/server/auth');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const projectName = (await rl.question('Project name: ')).trim();
  if (!projectName) {
    console.error('Project name is required.');
    process.exit(1);
  }
  const email = (await rl.question('Admin email: ')).trim();
  const name = (await rl.question('Admin name: ')).trim();
  rl.close();
  const password = await readHidden('Admin password: ');

  if (!email || !name || !password) {
    console.error('Email, name, and password are all required.');
    process.exit(1);
  }

  const project = await prisma.project.create({
    data: { name: projectName },
  });

  // No headers/request passed: createUser's sessionless bypass only applies
  // when both are absent. baseURL's `fallback` (see auth.ts) covers dynamic
  // baseURL resolution for this no-request case.
  const result = await auth.api.createUser({
    body: {
      email,
      name,
      password,
      role: 'admin',
      data: { projectId: project.id, emailVerified: true },
    },
  });

  await prisma.projectSetting.create({
    data: { projectId: project.id },
  });

  await prisma.category.createMany({
    data: SYSTEM_CATEGORIES.map((c) => ({ ...c, projectId: project.id })),
  });

  console.log(
    `Created project "${project.name}" (${project.id}) with admin ${result.user.email} (${result.user.id}) and ${SYSTEM_CATEGORIES.length} system categories.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
