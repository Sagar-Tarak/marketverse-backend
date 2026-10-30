import {
  BadRequestException,
  HttpStatus,
  type ArgumentsHost,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { throwAppError } from '../utils/app-error.util.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function catchAs(exception: unknown): {
  status: number;
  body: Record<string, unknown>;
} {
  let status = 0;
  let body: Record<string, unknown> = {};
  const response = {
    status: (code: number) => {
      status = code;
      return { json: (payload: Record<string, unknown>) => (body = payload) };
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/api/v1/x' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status, body };
}

describe('AllExceptionsFilter', () => {
  it('maps an AppError to its own status', () => {
    let thrown: unknown;
    try {
      throwAppError('Product NOPE not found.', HttpStatus.NOT_FOUND);
    } catch (error) {
      thrown = error;
    }
    const { status, body } = catchAs(thrown);
    expect(status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      message: 'Product NOPE not found.',
      path: '/api/v1/x',
    });
  });

  it('keeps validation messages from an HttpException', () => {
    const { status, body } = catchAs(
      new BadRequestException(['limit must not be less than 1']),
    );
    expect(status).toBe(400);
    expect(body.message).toEqual(['limit must not be less than 1']);
  });

  it('maps a Prisma unique violation to 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'x',
    });
    expect(catchAs(error).status).toBe(409);
  });

  it('hides unknown errors behind a generic 500', () => {
    const { status, body } = catchAs(new Error('db password is hunter2'));
    expect(status).toBe(500);
    expect(body.message).toBe('Internal server error.');
  });
});
