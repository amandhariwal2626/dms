import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { HEADER_NAMES } from '../constants/auth.constants';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const requestId =
      (req.headers[HEADER_NAMES.REQUEST_ID.toLowerCase()] as string) || randomUUID();
    const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
    const ipAddress = (req.headers[HEADER_NAMES.IP_ADDRESS] as string) || req.ip || '';
    const userAgent = req.headers[HEADER_NAMES.USER_AGENT] as string;

    const companyId = req.headers[HEADER_NAMES.COMPANY_ID.toLowerCase()] as string;
    const sessionId = req.headers[HEADER_NAMES.SESSION_ID.toLowerCase()] as string;

    const reqRecord = req as unknown as Record<string, string>;

    reqRecord.requestId = requestId;
    reqRecord.correlationId = correlationId;
    reqRecord.ipAddress = ipAddress;
    if (userAgent) reqRecord.userAgent = userAgent;
    if (companyId) reqRecord.companyId = companyId;
    if (sessionId) reqRecord.sessionId = sessionId;

    next();
  }
}
