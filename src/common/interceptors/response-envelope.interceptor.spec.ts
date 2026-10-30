import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor.js';

function run(
  result: unknown,
  method = 'GET',
  handler = () => undefined,
): Promise<unknown> {
  const context = {
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
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

  it('reports 201 for a POST', async () => {
    await expect(run({ id: 'w1' }, 'POST')).resolves.toMatchObject({
      statusCode: 201,
    });
  });

  it('honours an explicit @HttpCode', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata('__httpCode__', 202, handler);
    await expect(run({ ok: true }, 'POST', handler)).resolves.toMatchObject({
      statusCode: 202,
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
