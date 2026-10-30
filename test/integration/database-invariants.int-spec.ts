import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestClient,
  createWorld,
  resetDatabase,
  type WorldFixture,
} from './fixture.js';

let prisma: PrismaClient;
let w: WorldFixture;

beforeAll(() => {
  prisma = createTestClient();
});
afterAll(async () => {
  await resetDatabase(prisma);
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  w = await createWorld(prisma);
});

describe('inventory', () => {
  const balance = (onHand: number, reserved: number) =>
    prisma.inventoryBalance.create({
      data: {
        worldId: w.worldId,
        warehouseId: w.warehouseId,
        productId: w.productId,
        quantityOnHand: onHand,
        quantityReserved: reserved,
      },
    });

  it('accepts reserved <= on hand', async () => {
    await expect(balance(10, 10)).resolves.toBeDefined();
  });

  it('rejects reserved > on hand', async () => {
    await expect(balance(5, 9)).rejects.toThrow();
  });

  it('rejects a negative on-hand quantity', async () => {
    await expect(balance(-1, 0)).rejects.toThrow();
  });

  it('rejects a balance that points at a warehouse in another world', async () => {
    const other = await createWorld(prisma);
    await expect(
      prisma.inventoryBalance.create({
        data: {
          worldId: other.worldId,
          warehouseId: w.warehouseId,
          productId: w.productId,
          quantityOnHand: 1,
        },
      }),
    ).rejects.toThrow();
  });

  describe('movements', () => {
    const movement = (operationKey: string, lineNumber = 1) =>
      prisma.inventoryMovement.create({
        data: {
          worldId: w.worldId,
          productId: w.productId,
          destinationWarehouseId: w.warehouseId,
          quantity: 5,
          movementType: 'RECEIPT',
          referenceType: 'test',
          referenceId: randomUUID(),
          tickNumber: 1,
          operationKey,
          lineNumber,
        },
      });

    it('rejects a duplicate operation key and line (idempotency)', async () => {
      await movement('op-1');
      await expect(movement('op-1')).rejects.toThrow();
    });

    it('allows several lines under one operation key', async () => {
      await movement('op-2', 1);
      await expect(movement('op-2', 2)).resolves.toBeDefined();
    });

    it('is append-only: update and delete are rejected', async () => {
      const row = await movement('op-3');
      await expect(
        prisma.inventoryMovement.update({
          where: { id: row.id },
          data: { tickNumber: 2 },
        }),
      ).rejects.toThrow();
      await expect(
        prisma.inventoryMovement.delete({ where: { id: row.id } }),
      ).rejects.toThrow();
    });
  });
});

describe('markets', () => {
  it('rejects remaining quantity above total', async () => {
    const market = await prisma.market.create({
      data: {
        worldId: w.worldId,
        productId: w.productId,
        marketType: 'WHOLESALE_PERIODIC',
      },
    });
    await expect(
      prisma.marketOrder.create({
        data: {
          worldId: w.worldId,
          marketId: market.id,
          companyId: w.companyId,
          side: 'SELL',
          quantityTotal: 10,
          quantityRemaining: 11,
          limitPriceMinor: 100n,
          createdTick: 1,
          timePriority: 1n,
          operationKey: 'order-1',
        },
      }),
    ).rejects.toThrow();
  });
});

describe('ledger', () => {
  async function accounts() {
    const make = (accountCode: string) =>
      prisma.financialAccount.create({
        data: {
          worldId: w.worldId,
          companyId: w.companyId,
          accountCode,
          name: accountCode,
          accountType: 'ASSET',
          currencyCode: 'NVR',
        },
      });
    return { cash: await make('1000'), equity: await make('3000') };
  }

  const entry = (status: 'DRAFT' | 'POSTED', operationKey: string) => ({
    worldId: w.worldId,
    transactionReference: operationKey,
    entryTick: 0,
    status,
    operationKey,
  });

  it('commits a balanced posted entry', async () => {
    const { cash, equity } = await accounts();
    await prisma.$transaction(async (tx) => {
      const e = await tx.journalEntry.create({
        data: entry('POSTED', 'je-ok'),
      });
      await tx.ledgerPosting.createMany({
        data: [
          {
            worldId: w.worldId,
            journalEntryId: e.id,
            accountId: cash.id,
            debitMinor: 100n,
            currencyCode: 'NVR',
          },
          {
            worldId: w.worldId,
            journalEntryId: e.id,
            accountId: equity.id,
            creditMinor: 100n,
            currencyCode: 'NVR',
          },
        ],
      });
    });
    expect(await prisma.ledgerPosting.count()).toBe(2);
  });

  it('rolls back an unbalanced posted entry at commit', async () => {
    const { cash, equity } = await accounts();
    await expect(
      prisma.$transaction(async (tx) => {
        const e = await tx.journalEntry.create({
          data: entry('POSTED', 'je-bad'),
        });
        await tx.ledgerPosting.createMany({
          data: [
            {
              worldId: w.worldId,
              journalEntryId: e.id,
              accountId: cash.id,
              debitMinor: 100n,
              currencyCode: 'NVR',
            },
            {
              worldId: w.worldId,
              journalEntryId: e.id,
              accountId: equity.id,
              creditMinor: 90n,
              currencyCode: 'NVR',
            },
          ],
        });
      }),
    ).rejects.toThrow();
    expect(await prisma.journalEntry.count()).toBe(0);
    expect(await prisma.ledgerPosting.count()).toBe(0);
  });

  it('rejects a posting with both debit and credit', async () => {
    const { cash } = await accounts();
    const e = await prisma.journalEntry.create({
      data: entry('DRAFT', 'je-both'),
    });
    await expect(
      prisma.ledgerPosting.create({
        data: {
          worldId: w.worldId,
          journalEntryId: e.id,
          accountId: cash.id,
          debitMinor: 5n,
          creditMinor: 5n,
          currencyCode: 'NVR',
        },
      }),
    ).rejects.toThrow();
  });

  it('keeps postings and posted entries immutable', async () => {
    const { cash, equity } = await accounts();
    const e = await prisma.$transaction(async (tx) => {
      const created = await tx.journalEntry.create({
        data: entry('POSTED', 'je-imm'),
      });
      await tx.ledgerPosting.createMany({
        data: [
          {
            worldId: w.worldId,
            journalEntryId: created.id,
            accountId: cash.id,
            debitMinor: 50n,
            currencyCode: 'NVR',
          },
          {
            worldId: w.worldId,
            journalEntryId: created.id,
            accountId: equity.id,
            creditMinor: 50n,
            currencyCode: 'NVR',
          },
        ],
      });
      return created;
    });
    const posting = await prisma.ledgerPosting.findFirstOrThrow({
      where: { journalEntryId: e.id },
    });

    await expect(
      prisma.ledgerPosting.update({
        where: { id: posting.id },
        data: { debitMinor: 1n },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.ledgerPosting.delete({ where: { id: posting.id } }),
    ).rejects.toThrow();
    await expect(
      prisma.journalEntry.update({
        where: { id: e.id },
        data: { description: 'edited' },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.journalEntry.update({
        where: { id: e.id },
        data: { status: 'REVERSED' },
      }),
    ).resolves.toBeDefined();
  });

  it('requires an account to have exactly one owner', async () => {
    await expect(
      prisma.financialAccount.create({
        data: {
          worldId: w.worldId,
          accountCode: '9999',
          name: 'orphan',
          accountType: 'ASSET',
          currencyCode: 'NVR',
        },
      }),
    ).rejects.toThrow();
  });
});

describe('worlds and simulation', () => {
  it('allows only one OWNER participant per world', async () => {
    const second = await prisma.user.create({
      data: { id: randomUUID(), email: `${randomUUID()}@test.dev` },
    });
    await prisma.worldParticipant.create({
      data: { worldId: w.worldId, userId: w.userId, role: 'OWNER' },
    });
    await expect(
      prisma.worldParticipant.create({
        data: { worldId: w.worldId, userId: second.id, role: 'OWNER' },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.worldParticipant.create({
        data: { worldId: w.worldId, userId: second.id, role: 'MEMBER' },
      }),
    ).resolves.toBeDefined();
  });

  it('allows only one RUNNING tick per world', async () => {
    const tick = (tickNumber: number, status: 'RUNNING' | 'PENDING') =>
      prisma.simulationTick.create({
        data: { worldId: w.worldId, tickNumber, status, modelVersion: 'test' },
      });
    await tick(1, 'RUNNING');
    await expect(tick(2, 'RUNNING')).rejects.toThrow();
    await expect(tick(2, 'PENDING')).resolves.toBeDefined();
  });

  it('requires a company ownership to name exactly one owner', async () => {
    await expect(
      prisma.companyOwnership.create({
        data: {
          worldId: w.worldId,
          companyId: w.companyId,
          ownerType: 'USER',
          ownershipPercentage: 100,
          effectiveFromTick: 0,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.companyOwnership.create({
        data: {
          worldId: w.worldId,
          companyId: w.companyId,
          ownerType: 'USER',
          ownerUserId: w.userId,
          ownershipPercentage: 100,
          effectiveFromTick: 0,
        },
      }),
    ).resolves.toBeDefined();
  });
});
