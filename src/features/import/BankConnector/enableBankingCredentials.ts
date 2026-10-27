import type { EnableBankingCredentials } from './EnableBankingClient';

/**
 * Enable Banking's free tier is for the operator's own accounts only, so one
 * application serves one project per environment. Every other project gets
 * no credentials and therefore no bank features.
 */
export function getEnableBankingCredentials(
  projectId: string,
): EnableBankingCredentials | null {
  const applicationId = process.env.ENABLE_BANKING_APP_ID;
  const privateKey = process.env.ENABLE_BANKING_PRIVATE_KEY;
  const allowedProjectId = process.env.ENABLE_BANKING_PROJECT_ID;
  if (!applicationId || !privateKey || projectId !== allowedProjectId) {
    return null;
  }
  return { applicationId, privateKey: privateKey.replaceAll('\\n', '\n') };
}
