import { randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { Difficulty, GameWorld, WorldClock } from '@prisma/client';
import {
  skipTake,
  toPage,
  type Page,
  type PageRequest,
} from '../../common/pagination/pagination.js';
import { throwAppError } from '../../common/utils/app-error.util.js';
import {
  PrismaService,
  type TransactionClient,
} from '../../infrastructure/database/prisma.service.js';
import type { ClockView, WorldView } from './schemas/worlds.schema.js';

export interface CreateWorldInput {
  readonly ownerUserId: string;
  readonly name: string;
  readonly scenarioCode: string;
  readonly scenarioVersion: number;
  readonly currencyCode: string;
  readonly difficulty: Difficulty;
  readonly startingCapitalMinor: bigint;
  readonly startDate: Date;
  readonly modelVersion: string;
}

const toWorldView = (row: GameWorld): WorldView => ({
  id: row.id,
  name: row.name,
  status: row.status,
  scenarioCode: row.scenarioCode,
  scenarioVersion: row.scenarioVersion,
  currencyCode: row.currencyCode,
  difficulty: row.difficulty,
  startingCapitalMinor: row.startingCapitalMinor.toString(),
  modelVersion: row.modelVersion,
  createdAt: row.createdAt.toISOString(),
});

const toClockView = (row: WorldClock): ClockView => ({
  currentTick: row.currentTick,
  calendar: {
    year: row.calendarYear,
    month: row.calendarMonth,
    day: row.calendarDay,
  },
  simulationSpeed: row.simulationSpeed,
  paused: row.paused,
  catchUpPolicy: row.catchUpPolicy,
  maxCatchUpTicks: row.maxCatchUpTicks,
  lastCompletedAt: row.lastCompletedAt?.toISOString() ?? null,
});

@Injectable()
export class WorldsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the world, its OWNER participant and its clock (tick 0, paused) inside the caller's
   * transaction. The seed makes every later simulation run reproducible.
   */
  async create(
    tx: TransactionClient,
    input: CreateWorldInput,
  ): Promise<WorldView> {
    const row = await tx.gameWorld.create({
      data: {
        ownerUserId: input.ownerUserId,
        name: input.name,
        scenarioCode: input.scenarioCode,
        scenarioVersion: input.scenarioVersion,
        currencyCode: input.currencyCode,
        difficulty: input.difficulty,
        startingCapitalMinor: input.startingCapitalMinor,
        modelVersion: input.modelVersion,
        randomSeed: BigInt(randomBytes(6).readUIntBE(0, 6)),
        participants: {
          create: { userId: input.ownerUserId, role: 'OWNER' },
        },
        clock: {
          create: {
            calendarYear: input.startDate.getUTCFullYear(),
            calendarMonth: input.startDate.getUTCMonth() + 1,
            calendarDay: input.startDate.getUTCDate(),
          },
        },
      },
    });
    return toWorldView(row);
  }

  async listForUser(
    userId: string,
    request: PageRequest,
  ): Promise<Page<WorldView>> {
    const where = { participants: { some: { userId } } };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.gameWorld.count({ where }),
      this.prisma.gameWorld.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        ...skipTake(request),
      }),
    ]);
    return toPage(rows.map(toWorldView), total, request);
  }

  async getForUser(worldId: string, userId: string): Promise<WorldView> {
    const row = await this.prisma.gameWorld.findFirst({
      where: { id: worldId, participants: { some: { userId } } },
    });
    if (!row) this.notFound(worldId);
    return toWorldView(row);
  }

  async getClock(worldId: string, userId: string): Promise<ClockView> {
    await this.assertParticipant(worldId, userId);
    const row = await this.prisma.worldClock.findUnique({ where: { worldId } });
    if (!row) this.notFound(worldId);
    return toClockView(row);
  }

  /** 404, not 403: a user must not learn that someone else's world exists. */
  async assertParticipant(worldId: string, userId: string): Promise<void> {
    const participant = await this.prisma.worldParticipant.findUnique({
      where: { worldId_userId: { worldId, userId } },
      select: { id: true },
    });
    if (!participant) this.notFound(worldId);
  }

  private notFound(worldId: string): never {
    return throwAppError(`World ${worldId} not found.`, HttpStatus.NOT_FOUND);
  }
}
