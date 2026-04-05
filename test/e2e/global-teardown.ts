import { testPrisma } from './db/client';

export default async function globalTeardown() {
  await testPrisma.$disconnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (globalThis as any).__pgContainer__?.stop();
}
