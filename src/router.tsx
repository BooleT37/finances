import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { createStore } from 'jotai';

import { routeTree } from './routeTree.gen';

function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

// Created fresh per call: on the server this runs once per request, so each
// request gets its own Jotai store and query cache instead of sharing the
// long-lived Node process's module state (which caused SSR state — selected
// month, sidebar edit state, cached query data — to leak between requests).
export async function getRouter() {
  const queryClient = new QueryClient();
  const jotaiStore = createStore();

  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: false,
    defaultNotFoundComponent: NotFound,
    context: { queryClient, jotaiStore },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: Awaited<ReturnType<typeof getRouter>>;
  }
}
