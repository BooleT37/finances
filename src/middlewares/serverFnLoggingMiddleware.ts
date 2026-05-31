import { createMiddleware } from '@tanstack/react-start';

// Dev-only: log mutations' (POST server functions) raw input and (deserialized)
// output to the browser console, since the network tab shows them in an
// obfuscated, serialized form. Read-only GET queries are skipped to cut noise.
// `next()` returns the handler's value on a runtime-only `result` field that
// the public middleware type does not expose.
export const serverFnLoggingMiddleware = createMiddleware({
  type: 'function',
}).client(async ({ next, data, method, serverFnMeta }) => {
  if (!import.meta.env.DEV || method !== 'POST') {
    return next();
  }

  const start = performance.now();
  try {
    const result = await next();
    const output = (result as { result?: unknown }).result;
    console.groupCollapsed(
      `%c[serverfn] ${method} ${serverFnMeta.id}`,
      'color:#5cc',
    );
    console.log('input: ', data);
    console.log('output:', output);
    console.log(`took ${Math.round(performance.now() - start)}ms`);
    console.groupEnd();
    return result;
  } catch (error) {
    console.groupCollapsed(
      `%c[serverfn] ${method} ${serverFnMeta.id} — ERROR`,
      'color:#f66',
    );
    console.log('input:', data);
    console.log('error:', error);
    console.groupEnd();
    throw error;
  }
});
