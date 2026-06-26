import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { CompanyContext } from '../types/auth.types';

export const CurrentCompany = createParamDecorator(
  (data: keyof CompanyContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ company?: CompanyContext }>();
    const company = request.company;
    if (!company) return undefined;
    if (data) return company[data];
    return company;
  },
);
