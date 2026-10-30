import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import {
  fingerprint,
  IdempotencyService,
} from '../identity/idempotency.service.js';
import {
  CreateWorldDto,
  type WorldSetupView,
} from './schemas/world-setup.schema.js';
import { WorldSetupService } from './world-setup.service.js';

@ApiTags('worlds')
@Controller('worlds')
export class WorldSetupController {
  constructor(
    private readonly setup: WorldSetupService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /** Send an `Idempotency-Key` header to make a retry return the first world instead of a second one. */
  @Post()
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorldDto,
    @Headers('idempotency-key') key?: string,
  ): Promise<WorldSetupView> {
    if (!key) return this.setup.createWorld(user, dto);

    return this.idempotency.execute(
      {
        userId: user.id,
        scope: 'account',
        operation: 'worlds:create',
        key,
        requestHash: fingerprint(dto),
      },
      () => this.setup.createWorld(user, dto),
    );
  }
}
