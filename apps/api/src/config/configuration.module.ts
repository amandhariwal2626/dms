import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './env.validation';
import { authConfig } from '../modules/auth/config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      load: [authConfig],
    }),
  ],
})
export class ConfigurationModule {
  // Global configuration module
}
