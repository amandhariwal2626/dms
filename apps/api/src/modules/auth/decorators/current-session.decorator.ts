import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { SessionContext } from '../types/auth.types';

export const CurrentSession = createParamDecorator(
  (data: keyof SessionContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ session?: SessionContext }>();
    const session = request.session;
    if (!session) return undefined;
    if (data) return session[data];
    return session;
  },
);
