import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/savings-spendings')({
  component: Outlet,
});
