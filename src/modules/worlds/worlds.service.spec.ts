import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AppError } from '../../common/utils/app-error.util.js';
import { WorldsService } from './worlds.service.js';

const input = {
  ownerUserId: 'u1',
  name: 'Alpha',
  scenarioCode: 'NOVARA_PROTOTYPE',
  scenarioVersion: 1,
  currencyCode: 'NVR',
  difficulty: 'NORMAL' as const,
  startingCapitalMinor: 10_000_000n,
  startDate: new Date('2030-01-01T00:00:00Z'),
  modelVersion: 'v0.1',
};

describe('WorldsService.create', () => {
  it('creates the world with an OWNER participant and a clock at the scenario start date', async () => {
    const create = vi.fn((args: { data: { name: string } }) =>
      Promise.resolve({
        id: 'w1',
        ...args.data,
        status: 'CREATING',
        startingCapitalMinor: 10_000_000n,
        createdAt: new Date('2030-01-01T00:00:00Z'),
      }),
    );
    const service = new WorldsService({} as never);

    const view = await service.create(
      { gameWorld: { create } } as never,
      input,
    );

    const data = create.mock.calls[0]?.[0].data as unknown as Record<
      string,
      unknown
    >;
    expect(data.participants).toEqual({
      create: { userId: 'u1', role: 'OWNER' },
    });
    expect(data.clock).toEqual({
      create: { calendarYear: 2030, calendarMonth: 1, calendarDay: 1 },
    });
    expect(typeof data.randomSeed).toBe('bigint');
    expect(view.startingCapitalMinor).toBe('10000000');
  });
});

describe('WorldsService.assertParticipant', () => {
  it('answers 404 (not 403) for a world the user does not belong to', async () => {
    const service = new WorldsService({
      worldParticipant: { findUnique: () => Promise.resolve(null) },
    } as never);

    const error = await service
      .assertParticipant('w1', 'u2')
      .catch((e: unknown) => e);

    expect((error as AppError).getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('passes for a participant', async () => {
    const service = new WorldsService({
      worldParticipant: { findUnique: () => Promise.resolve({ id: 'p1' }) },
    } as never);

    await expect(
      service.assertParticipant('w1', 'u1'),
    ).resolves.toBeUndefined();
  });
});
