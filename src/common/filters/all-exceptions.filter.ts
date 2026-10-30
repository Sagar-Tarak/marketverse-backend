import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  readonly statusCode: number;
  readonly message: string | readonly string[];
}

const PRISMA_ERRORS: Readonly<Record<string, ErrorBody>> = {
  P2002: { statusCode: HttpStatus.CONFLICT, message: 'Record already exists.' },
  P2003: {
    statusCode: HttpStatus.CONFLICT,
    message: 'A related record is missing or still in use.',
  },
  P2025: { statusCode: HttpStatus.NOT_FOUND, message: 'Record not found.' },
};

function toErrorBody(exception: unknown): ErrorBody | undefined {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    const message =
      typeof response === 'object' && 'message' in response
        ? (response.message as ErrorBody['message'])
        : exception.message;
    return { statusCode: exception.getStatus(), message };
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_ERRORS[exception.code];
  }
  return undefined;
}

/** One error shape for every failure: expected ones are mapped, the rest become a generic 500. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const mapped = toErrorBody(exception);
    if (!mapped) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    const body = mapped ?? {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error.',
    };

    response.status(body.statusCode).json({
      statusCode: body.statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: body.message,
    });
  }
}
