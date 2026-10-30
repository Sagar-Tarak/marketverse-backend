import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants.js';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import { isPage } from '../pagination/pagination.js';

/** Nest applies the final status after interceptors run, so derive it: @HttpCode(), else 201 for POST. */
function statusOf(context: ExecutionContext): number {
  const explicit: unknown = Reflect.getMetadata(
    HTTP_CODE_METADATA,
    context.getHandler(),
  );
  if (typeof explicit === 'number') return explicit;
  const { method } = context.switchToHttp().getRequest<Request>();
  return method === 'POST' ? HttpStatus.CREATED : HttpStatus.OK;
}

/**
 * Wraps JSON results in `{ statusCode, data, message }`. A `Page` becomes
 * `{ statusCode, data, count, paginationMetadata, message }`. Strings and empty
 * bodies pass through untouched.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const statusCode = statusOf(context);

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
