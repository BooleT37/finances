import { useRouteContext } from '@tanstack/react-router';

export function useIsAdmin() {
  const { session } = useRouteContext({ from: '/_authenticated' });
  return session.role === 'admin';
}
