import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppError } from '../common/utils/app-error.util.js';
import { HealthService } from './health.service.js';

function serviceWith(queryRaw: () => Promise<unknown>): HealthService {
  return new HealthService({ $queryRaw: queryRaw } as never);
}

describe('HealthService', () => {
  it('reports ok when the database answers', async () => {
    const service = serviceWith(() => Promise.resolve([{ ok: 1 }]));
    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('answers 503 when the database is down', async () => {
    const service = serviceWith(() => Promise.reject(new Error('refused')));

    const error = await service.check().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).getStatus()).toBe(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });
});
