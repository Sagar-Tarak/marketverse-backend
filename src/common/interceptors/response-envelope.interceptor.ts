import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import { isPage } from '../pagination/pagination.js';

/**
 * Wraps JSON results in `{ statusCode, data, message }`. A `Page` becomes
 * `{ statusCode, data, count, paginationMetadata, message }`. Strings and empty
 * bodies pass through untouched.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { statusCode } = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((result: unknown) => {
        if (typeof result !== 'object' || result === null) return result;

        if (isPage(result)) {
          const { items, page, limit, total } = result;
          return {
            statusCode,
            data: items,
            count: total,
            paginationMetadata: {
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
            message: 'Success',
          };
        }
        return { statusCode, data: result, message: 'Success' };
      }),
    );
  }
}
