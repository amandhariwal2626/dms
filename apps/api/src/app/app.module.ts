import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigurationModule } from '../config/configuration.module';
import { HealthModule } from '../health/health.module';
import { AuthModule } from '../modules/auth/auth.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ConfigurationModule,
    HealthModule,
    AuthModule,
    EventEmitterModule.forRoot(),
    DatabaseModule,
  ],
})
export class AppModule {
  // Root application module
}
