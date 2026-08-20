import { randomUUID } from 'crypto';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('http');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const start = Date.now();
    const rid =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    res.setHeader('x-request-id', rid);

    const line = (status: number | string) =>
      `${rid} ${req.method} ${req.url} ${status} ${Date.now() - start}ms user=${req.user?.id ?? '-'}`;

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(line(res.statusCode)),
        error: (err: unknown) =>
          this.logger.error(
            line(err instanceof HttpException ? err.getStatus() : 500),
          ),
      }),
    );
  }
}
