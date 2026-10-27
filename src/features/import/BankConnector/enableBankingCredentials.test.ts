import { afterEach, describe, expect, it, vi } from 'vitest';

import { ENABLE_BANKING_API_URL } from './EnableBankingClient';
import { getEnableBankingCredentials } from './enableBankingCredentials';

const setEnv = (env: Record<string, string>) => {
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value);
  }
};

const fullEnv = {
  ENABLE_BANKING_APP_ID: 'app',
  ENABLE_BANKING_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
  ENABLE_BANKING_PROJECT_ID: 'operator-project',
  ENABLE_BANKING_API_URL: '',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getEnableBankingCredentials', () => {
  it('returns the credentials for the allowed project', () => {
    setEnv(fullEnv);

    expect(getEnableBankingCredentials('operator-project')).toEqual({
      applicationId: 'app',
      privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
      apiUrl: ENABLE_BANKING_API_URL,
    });
  });

  it('returns nothing for any other project', () => {
    setEnv(fullEnv);

    expect(getEnableBankingCredentials('another-project')).toBeNull();
  });

  it.each([
    'ENABLE_BANKING_APP_ID',
    'ENABLE_BANKING_PRIVATE_KEY',
    'ENABLE_BANKING_PROJECT_ID',
  ])('returns nothing when %s is missing', (name) => {
    setEnv({ ...fullEnv, [name]: '' });

    expect(getEnableBankingCredentials('operator-project')).toBeNull();
  });

  it('uses the overridden API URL when one is set', () => {
    setEnv({ ...fullEnv, ENABLE_BANKING_API_URL: 'http://localhost:3998' });

    expect(getEnableBankingCredentials('operator-project')?.apiUrl).toBe(
      'http://localhost:3998',
    );
  });
});
