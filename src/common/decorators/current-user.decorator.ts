import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../types/auth.types.js';

/** The user the AuthGuard attached to the request. Only valid on non-@Public routes. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user)
      throw new Error('CurrentUser used on a route without authentication.');
    return user;
  },
);
