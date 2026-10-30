import { HttpException, HttpStatus } from '@nestjs/common';

/** The one custom exception: a business-rule failure with an HTTP status. */
export class AppError extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode);
  }
}

export function throwAppError(
  message: string,
  statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
): never {
  throw new AppError(message, statusCode);
}
