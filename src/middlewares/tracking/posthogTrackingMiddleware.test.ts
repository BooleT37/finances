import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { posthogTrackingMiddleware } from './posthogTrackingMiddleware';
import { trackInput } from './trackInput';

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  request: new Request('http://localhost/_serverFn'),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => mocks.request,
}));
vi.mock('~/server/posthog', () => ({
  posthog: { capture: mocks.capture },
}));
vi.mock('~/server/getSessionForRequest', () => ({
  getSessionForRequest: async () => null,
}));

type Next = () => Promise<unknown>;
type ServerMiddlewareFn = (ctx: {
  next: Next;
  data: unknown;
  method: string;
  serverFnMeta: typeof serverFnMeta;
}) => Promise<unknown>;

const serverFnMeta = {
  id: 'createThing-id',
  name: 'createThing',
  filename: 'src/features/things/api.ts',
};

type ThingInput = { name: string; cost: string; categoryId: number };
const input: ThingInput = { name: 'Coffee', cost: '-3.50', categoryId: 5 };

const getServer = (middleware: { options: unknown }) =>
  (middleware.options as { server: ServerMiddlewareFn }).server;

const runTracked = (handler: Next, withTrackInput: boolean) =>
  getServer(posthogTrackingMiddleware)({
    method: 'POST',
    data: input,
    serverFnMeta,
    next: withTrackInput
      ? () =>
          getServer(trackInput<ThingInput>({ name: 'omit', cost: 'send' }))({
            method: 'POST',
            data: input,
            serverFnMeta,
            next: handler,
          })
      : handler,
  });

const capturedProperties = () =>
  mocks.capture.mock.calls[0][0].properties as Record<string, unknown>;

beforeEach(() => {
  mocks.capture.mockClear();
  mocks.request = new Request('http://localhost/_serverFn');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('posthogTrackingMiddleware', () => {
  it('sends no input for a function without trackInput', async () => {
    await runTracked(async () => ({}), false);

    expect(capturedProperties()).toMatchObject({
      name: 'createThing',
      success: true,
    });
    expect(capturedProperties().input).toBeUndefined();
  });

  it('sends the input that trackInput allows', async () => {
    await runTracked(async () => ({}), true);

    expect(capturedProperties().input).toEqual({
      cost: '-3.50',
      categoryId: 5,
    });
  });

  it('sends the tracked input on a failed call too', async () => {
    await expect(
      runTracked(async () => {
        throw new Error('boom');
      }, true),
    ).rejects.toThrow('boom');

    expect(capturedProperties()).toMatchObject({
      success: false,
      input: { cost: '-3.50', categoryId: 5 },
    });
  });

  it('sends the duration of the call', async () => {
    await runTracked(async () => ({}), false);

    expect(capturedProperties().durationMs).toEqual(expect.any(Number));
  });

  it('sends the error type and code but not the message', async () => {
    const error = Object.assign(
      new Error('Foreign key violated for name "Coffee"'),
      { name: 'PrismaClientKnownRequestError', code: 'P2003' },
    );

    await expect(
      runTracked(async () => {
        throw error;
      }, false),
    ).rejects.toBe(error);

    expect(capturedProperties().error).toEqual({
      type: 'PrismaClientKnownRequestError',
      code: 'P2003',
    });
    expect(JSON.stringify(capturedProperties())).not.toContain('Coffee');
  });

  it('sends the paths and codes of validation issues', async () => {
    const schema = z.object({
      components: z.array(z.object({ cost: z.string() })),
    });
    const { error } = schema.safeParse({ components: [{ cost: 5 }] });

    await expect(
      runTracked(async () => {
        throw error;
      }, false),
    ).rejects.toBe(error);

    expect(capturedProperties().error).toEqual({
      type: 'ZodError',
      issues: [{ path: 'components.0.cost', code: 'invalid_type' }],
    });
  });

  it('does not capture GET calls', async () => {
    await getServer(posthogTrackingMiddleware)({
      method: 'GET',
      data: input,
      serverFnMeta,
      next: async () => ({}),
    });

    expect(mocks.capture).not.toHaveBeenCalled();
  });
});
