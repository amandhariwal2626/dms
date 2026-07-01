import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

export const CurrentCompanyUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ companyUserId?: string }>();
  return request.companyUserId;
});
