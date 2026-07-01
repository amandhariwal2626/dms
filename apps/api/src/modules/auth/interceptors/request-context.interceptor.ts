import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuthenticatedRequest, RequestContext } from '../types/auth.types';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user) {
      const req = request as unknown as Record<string, string | undefined>;
      const ctx: RequestContext = {};

      if (req.requestId) ctx.requestId = req.requestId;
      if (req.correlationId) ctx.correlationId = req.correlationId;
      if (req.ipAddress) ctx.ipAddress = req.ipAddress;
      if (req.userAgent) ctx.userAgent = req.userAgent;

      request.requestContext = ctx;
    }

    return next.handle();
  }
}
