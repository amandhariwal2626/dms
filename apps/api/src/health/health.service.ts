import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  readonly status: 'ok';
  readonly uptime: number;
  readonly timestamp: string;
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
