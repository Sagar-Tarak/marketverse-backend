import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js';
import type { AuthenticatedRequest } from '../../../common/types/auth.types.js';
import { throwAppError } from '../../../common/utils/app-error.util.js';
import { readDevIdentity } from '../functions/dev-auth.functions.js';
import { IdentityService } from '../identity.service.js';

/** Registered globally by IdentityModule. Every route needs a user unless it is @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identity: IdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const identity = readDevIdentity(request.headers);
    if (!identity) {
      throwAppError('Authentication required.', HttpStatus.UNAUTHORIZED);
    }

    request.user = await this.identity.ensureUser(identity);
    return true;
  }
}
