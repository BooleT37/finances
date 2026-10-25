import { getRequest } from '@tanstack/react-start/server';

// trackInput runs inside the global posthogTrackingMiddleware, which cannot read
// its context (and loses it entirely when `next()` throws), so the result is
// handed over per request and per server function instead.
const trackedInputByRequest = new WeakMap<Request, Map<string, unknown>>();

export const setTrackedInput = (serverFnId: string, input: unknown) => {
  const request = getRequest();
  const trackedInputs =
    trackedInputByRequest.get(request) ?? new Map<string, unknown>();
  trackedInputs.set(serverFnId, input);
  trackedInputByRequest.set(request, trackedInputs);
};

export const getTrackedInput = (serverFnId: string) =>
  trackedInputByRequest.get(getRequest())?.get(serverFnId);
