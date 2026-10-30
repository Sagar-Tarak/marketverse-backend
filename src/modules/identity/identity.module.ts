import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard.js';
import { IdempotencyService } from './idempotency.service.js';
import { IdentityController } from './identity.controller.js';
import { IdentityService } from './identity.service.js';

@Module({
  controllers: [IdentityController],
  providers: [
    IdentityService,
    IdempotencyService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [IdentityService, IdempotencyService],
})
export class IdentityModule {}
