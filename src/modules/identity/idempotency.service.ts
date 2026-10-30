import { createHash } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, type IdempotencyKey } from '@prisma/client';
import { throwAppError } from '../../common/utils/app-error.util.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

const KEY_TTL_MS = 24 * 60 * 60 * 1000;

export interface IdempotencyRequest {
  readonly userId: string;
  /** 'account' or 'world:<uuid>'. */
  readonly scope: string;
  readonly operation: string;
  /** Client-supplied `Idempotency-Key` header. */
  readonly key: string;
  /** `fingerprint(body)`: detects the same key reused with a different request. */
  readonly requestHash: string;
}

/** Hash of a request body. Key order matters, so clients must send the same JSON on a retry. */
export function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Makes a mutation safe to retry. The first call runs `work` and stores its JSON result; a retry with
 * the same key and the same request gets the stored result back. `work` must return JSON-safe data.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    request: IdempotencyRequest,
    work: () => Promise<T>,
  ): Promise<T> {
    const { userId, scope, operation, key } = request;
    const where = {
      userId_scope_operation_key: { userId, scope, operation, key },
    };

    const existing = await this.prisma.idempotencyKey.findUnique({ where });
    if (existing && existing.expiresAt > new Date()) {
      return this.replay<T>(existing, request.requestHash);
    }
    if (existing) await this.prisma.idempotencyKey.delete({ where });

    try {
      await this.prisma.idempotencyKey.create({
        data: {
          userId,
          scope,
          operation,
          key,
          requestHash: request.requestHash,
          expiresAt: new Date(Date.now() + KEY_TTL_MS),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Lost a race with a concurrent request carrying the same key.
        const raced = await this.prisma.idempotencyKey.findUnique({ where });
        if (raced) return this.replay<T>(raced, request.requestHash);
      }
      throw error;
    }

    try {
      const result = await work();
      await this.prisma.idempotencyKey.update({
        where,
        data: {
          responseBody: result as unknown as Prisma.InputJsonValue,
        },
      });
      return result;
    } catch (error) {
      // Free the key so the client can retry after a failure.
      await this.prisma.idempotencyKey.delete({ where });
      throw error;
    }
  }

  private replay<T>(row: IdempotencyKey, requestHash: string): T {
    if (row.requestHash !== requestHash) {
      throwAppError(
        'This Idempotency-Key was already used with a different request.',
        HttpStatus.CONFLICT,
      );
    }
    if (row.responseBody === null) {
      throwAppError(
        'A request with this Idempotency-Key is still being processed.',
        HttpStatus.CONFLICT,
      );
    }
    return row.responseBody as T;
  }
}
