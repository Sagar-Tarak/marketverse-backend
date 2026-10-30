import { HttpStatus, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { AppError } from '../../../common/utils/app-error.util.js';
import type { IdentityService } from '../identity.service.js';
import { AuthGuard } from './auth.guard.js';

const ID = '0b9c6b1e-4f35-4c53-9a58-3f2d1c0e7a11';

function setup(options: {
  isPublic?: boolean;
  headers?: Record<string, string>;
}) {
  const request: { headers: Record<string, string>; user?: unknown } = {
    headers: options.headers ?? {},
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const ensureUser = vi.fn(() => Promise.resolve({ id: ID, email: 'a@b.c' }));
  const guard = new AuthGuard(
    {
      getAllAndOverride: () => options.isPublic ?? false,
    } as unknown as Reflector,
    { ensureUser } as unknown as IdentityService,
  );
  return { guard, context, request, ensureUser };
}

describe('AuthGuard', () => {
  it('lets @Public() routes through without a user', async () => {
    const { guard, context, ensureUser } = setup({ isPublic: true });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(ensureUser).not.toHaveBeenCalled();
  });

  it('answers 401 when no identity is sent', async () => {
    const { guard, context } = setup({});
    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect((error as AppError).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('attaches the resolved user to the request', async () => {
    const { guard, context, request } = setup({
      headers: { 'x-dev-user-id': ID },
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: ID, email: 'a@b.c' });
  });
});
