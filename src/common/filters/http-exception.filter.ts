import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const IGNORED_PATHS = ['/favicon.ico'];

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
}

function isDrizzleError(exception: unknown): exception is Error & { cause?: Error } {
  return exception instanceof Error && exception.constructor.name === 'DrizzleQueryError';
}

function extractMessage(exception: unknown): { status: number; message: string } {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    const message =
      typeof response === 'string'
        ? response
        : (response as Record<string, unknown>).message?.toString() ?? exception.message;
    return { status: exception.getStatus(), message };
  }

  const errorMessage =
    isDrizzleError(exception)
      ? (exception.cause?.message ?? exception.message)
      : exception instanceof Error
        ? exception.message
        : String(exception);

  if (errorMessage.includes('invalid input syntax for type uuid')) {
    return { status: HttpStatus.BAD_REQUEST, message: 'Invalid UUID format in request' };
  }

  if (errorMessage.includes('unique constraint')) {
    return { status: HttpStatus.CONFLICT, message: 'Resource already exists' };
  }

  if (errorMessage.includes('foreign key constraint')) {
    return { status: HttpStatus.UNPROCESSABLE_ENTITY, message: 'Referenced resource does not exist' };
  }

  return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = extractMessage(exception);

    if (!IGNORED_PATHS.includes(request.url)) {
      if (status >= 500) {
        this.logger.error(exception);
      } else {
        this.logger.warn(`${status} ${request.method} ${request.url} — ${message}`);
      }
    }

    const body: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    response.status(status).json(body);
  }
}
