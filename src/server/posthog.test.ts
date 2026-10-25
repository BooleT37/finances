import { afterEach, describe, expect, it, vi } from 'vitest';

const importPosthog = async (nodeEnv: string) => {
  vi.stubEnv('POSTHOG_API_KEY', 'phc_test');
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.resetModules();
  return (await import('./posthog')).posthog;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('posthog', () => {
  it('has no client in the test environment', async () => {
    expect(await importPosthog('test')).toBeNull();
  });

  it('has a client outside the test environment', async () => {
    const posthog = await importPosthog('production');

    expect(posthog).not.toBeNull();
    await posthog?.shutdown();
  });
});
