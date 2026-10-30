import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AppError } from '../../common/utils/app-error.util.js';
import { IdentityService } from './identity.service.js';

const identity = { id: 'u1', email: 'ana@example.com' };

function serviceWith(user: object): {
  service: IdentityService;
  create: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn((args: { data: object }) => Promise.resolve(args.data));
  return { service: new IdentityService({ user } as never), create };
}

describe('IdentityService.ensureUser', () => {
  it('creates the profile the first time an identity is seen', async () => {
    const create = vi.fn(() =>
      Promise.resolve({ ...identity, status: 'ACTIVE' }),
    );
    const service = new IdentityService({
      user: { findUnique: () => Promise.resolve(null), create },
    } as never);

    await expect(service.ensureUser(identity)).resolves.toEqual(identity);
    expect(create).toHaveBeenCalledWith({ data: identity });
  });

  it('does not create a second profile for a known user', async () => {
    const create = vi.fn();
    const service = new IdentityService({
      user: {
        findUnique: () => Promise.resolve({ ...identity, status: 'ACTIVE' }),
        create,
      },
    } as never);

    await service.ensureUser(identity);
    expect(create).not.toHaveBeenCalled();
  });

  it('blocks a suspended account with 403', async () => {
    const { service } = serviceWith({
      findUnique: () => Promise.resolve({ ...identity, status: 'SUSPENDED' }),
    });

    const error = await service.ensureUser(identity).catch((e: unknown) => e);

    expect((error as AppError).getStatus()).toBe(HttpStatus.FORBIDDEN);
  });
});

describe('IdentityService.updateProfile', () => {
  it('sends only the fields that were provided', async () => {
    const update = vi.fn(() =>
      Promise.resolve({
        ...identity,
        displayName: 'Ana',
        status: 'ACTIVE',
        preferences: {},
        createdAt: new Date('2030-01-01T00:00:00Z'),
      }),
    );
    const service = new IdentityService({ user: { update } } as never);

    const view = await service.updateProfile('u1', { displayName: 'Ana' });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { displayName: 'Ana' },
    });
    expect(view).toMatchObject({
      displayName: 'Ana',
      createdAt: '2030-01-01T00:00:00.000Z',
    });
  });
});
