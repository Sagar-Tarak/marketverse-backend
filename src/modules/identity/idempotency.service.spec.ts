import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AppError } from '../../common/utils/app-error.util.js';
import { fingerprint, IdempotencyService } from './idempotency.service.js';

const request = {
  userId: 'u1',
  scope: 'account',
  operation: 'worlds:create',
  key: 'k-1',
  requestHash: fingerprint({ name: 'Alpha' }),
};
const future = new Date(Date.now() + 60_000);

function setup(existing: object | null) {
  const store = {
    findUnique: vi.fn(() => Promise.resolve(existing)),
    create: vi.fn(() => Promise.resolve({})),
    update: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  };
  return {
    store,
    service: new IdempotencyService({ idempotencyKey: store } as never),
  };
}

describe('IdempotencyService', () => {
  it('runs the work once and stores its result', async () => {
    const { store, service } = setup(null);
    const work = vi.fn(() => Promise.resolve({ id: 'w1' }));

    await expect(service.execute(request, work)).resolves.toEqual({ id: 'w1' });

    expect(work).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { responseBody: { id: 'w1' } } }),
    );
  });

  it('returns the stored result for a retry without running the work again', async () => {
    const { service } = setup({
      requestHash: request.requestHash,
      responseBody: { id: 'w1' },
      expiresAt: future,
    });
    const work = vi.fn();

    await expect(service.execute(request, work)).resolves.toEqual({ id: 'w1' });
    expect(work).not.toHaveBeenCalled();
  });

  it('answers 409 when the key is reused with a different request', async () => {
    const { service } = setup({
      requestHash: fingerprint({ name: 'Other' }),
      responseBody: { id: 'w1' },
      expiresAt: future,
    });

    const error = await service
      .execute(request, vi.fn())
      .catch((e: unknown) => e);

    expect((error as AppError).getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('answers 409 while the first request is still running', async () => {
    const { service } = setup({
      requestHash: request.requestHash,
      responseBody: null,
      expiresAt: future,
    });

    const error = await service
      .execute(request, vi.fn())
      .catch((e: unknown) => e);

    expect((error as AppError).message).toContain('still being processed');
  });

  it('frees the key when the work fails so the client can retry', async () => {
    const { store, service } = setup(null);

    await expect(
      service.execute(request, () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    expect(store.delete).toHaveBeenCalledTimes(1);
  });

  it('treats an expired key as unused', async () => {
    const { store, service } = setup({
      requestHash: 'old',
      responseBody: { id: 'old' },
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      service.execute(request, () => Promise.resolve({ id: 'new' })),
    ).resolves.toEqual({
      id: 'new',
    });
    expect(store.delete).toHaveBeenCalledTimes(1);
  });
});
