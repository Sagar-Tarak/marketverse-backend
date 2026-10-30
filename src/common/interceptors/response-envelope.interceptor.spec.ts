import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor.js';

function run(result: unknown, statusCode = 200): Promise<unknown> {
  const context = {
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(result) };
  return lastValueFrom(
    new ResponseEnvelopeInterceptor().intercept(context, next),
  );
}

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps an object', async () => {
    await expect(run({ code: 'WHEAT' })).resolves.toEqual({
      statusCode: 200,
      data: { code: 'WHEAT' },
      message: 'Success',
    });
  });

  it('wraps a page with count and pagination metadata', async () => {
    const page = { items: [1, 2], page: 2, limit: 2, total: 5 };
    await expect(run(page)).resolves.toEqual({
      statusCode: 200,
      data: [1, 2],
      count: 5,
      paginationMetadata: { page: 2, limit: 2, totalPages: 3 },
      message: 'Success',
    });
  });

  it('leaves strings and empty bodies alone', async () => {
    await expect(run('Hello World!')).resolves.toBe('Hello World!');
    await expect(run(undefined)).resolves.toBeUndefined();
  });
});
