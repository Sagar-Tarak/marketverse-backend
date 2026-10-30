import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { throwAppError } from '../common/utils/app-error.util.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';

export interface HealthStatus {
  readonly status: 'ok';
  readonly database: 'up';
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
      );
      throwAppError('Database unavailable.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: 'ok', database: 'up' };
  }
}
