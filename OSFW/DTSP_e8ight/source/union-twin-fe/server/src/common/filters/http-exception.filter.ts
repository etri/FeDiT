import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: unknown;
    let errorCode: string | null = null;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const obj = exceptionResponse as Record<string, unknown>;
      message = obj.message;
      const code = obj.errorCode;
      if (typeof code === 'string') errorCode = code;
    }

    response.status(status).json({
      data: null,
      error: {
        statusCode: status,
        errorCode,
        message,
        type: exception.name,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
