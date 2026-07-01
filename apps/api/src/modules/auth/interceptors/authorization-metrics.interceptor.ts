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
export class AuthorizationMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthorizationMetricsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = performance.now();
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = performance.now() - start;
          if (url.includes('permission') || url.includes('role') || url.includes('auth')) {
            this.logger.debug(`${method} ${url} - ${duration.toFixed(2)}ms`);
          }
        },
        error: (error: Error) => {
          const duration = performance.now() - start;
          this.logger.warn(`${method} ${url} failed - ${duration.toFixed(2)}ms - ${error.message}`);
        },
      }),
    );
  }
}
