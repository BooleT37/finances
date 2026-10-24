import { LangfuseClient } from '@langfuse/client';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { NodeSDK } from '@opentelemetry/sdk-node';

declare global {
  var langfuse: ReturnType<typeof createLangfuse> | undefined;
}

const missingEnvVars = [
  'LANGFUSE_PUBLIC_KEY',
  'LANGFUSE_SECRET_KEY',
  'LANGFUSE_BASE_URL',
].filter((name) => !process.env[name]);

function createLangfuse() {
  // Immediate export, so spans are sent before a serverless function freezes.
  const spanProcessor = new LangfuseSpanProcessor({
    exportMode: 'immediate',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
  });
  new NodeSDK({
    serviceName: 'finances',
    autoDetectResources: false,
    spanProcessors: [spanProcessor],
  }).start();
  return { spanProcessor, client: new LangfuseClient() };
}

function startLangfuse() {
  if (missingEnvVars.length > 0) {
    console.warn(
      `Langfuse tracing is off: ${missingEnvVars.join(', ')} not set`,
    );
    return null;
  }
  try {
    return globalThis.langfuse ?? createLangfuse();
  } catch (error) {
    console.warn('Langfuse tracing is off: failed to start', error);
    return null;
  }
}

const langfuse = startLangfuse();

if (process.env.NODE_ENV !== 'production') {
  globalThis.langfuse = langfuse ?? undefined;
}

export const isTracingOn = langfuse !== null;
export const langfuseClient = langfuse?.client ?? null;

/**
 * Sends everything still queued for Langfuse. Call it before a server
 * function returns; a failure is only logged, so tracing never fails a request.
 */
export async function flushLangfuse(): Promise<void> {
  if (!langfuse) {
    return;
  }
  try {
    await Promise.all([
      langfuse.spanProcessor.forceFlush(),
      langfuse.client.flush(),
    ]);
  } catch (error) {
    console.error('Failed to send data to Langfuse', error);
  }
}
