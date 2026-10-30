import type { Prisma } from '@prisma/client';

export interface Seeder {
  /** Unique name; `pnpm db:seed <name>` runs only this seeder. */
  readonly name: string;
  /** Must be idempotent (upsert on natural keys): the command can run many times. */
  run(tx: Prisma.TransactionClient): Promise<void>;
}
