import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PermissionTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PermissionTimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = performance.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = performance.now() - start;
        if (duration > 100) {
          this.logger.warn(
            `Slow permission operation: ${request.method} ${request.url} - ${duration.toFixed(2)}ms`,
          );
        }
      }),
    );
  }
}
