import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Algorithm } from 'jsonwebtoken';
import { ConfigurationModule } from '@/config/configuration.module';
import type { EnvironmentVariables } from '@/config/env.validation';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { EmailVerificationService } from './services/email-verification.service';
import { HashService } from './services/hash.service';
import { SessionTokenService } from './services/session-token.service';
import { JwtConfigService } from './services/jwt-config.service';
import { AuthRepository } from './repositories/auth.repository';
import { SessionRepository } from './repositories/session.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthListener } from './listeners/auth.listener';

@Module({
  imports: [
    ConfigurationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          algorithm: configService.get<Algorithm>('JWT_ALGORITHM'),
          issuer: configService.get<string>('JWT_ISSUER'),
          audience: configService.get<string>('JWT_AUDIENCE'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    PasswordService,
    EmailVerificationService,
    HashService,
    SessionTokenService,
    JwtConfigService,
    AuthRepository,
    SessionRepository,
    JwtStrategy,
    RefreshStrategy,
    LocalStrategy,
    AuthListener,
  ],
  exports: [
    AuthService,
    TokenService,
    SessionService,
    PasswordService,
    EmailVerificationService,
    HashService,
    SessionTokenService,
    JwtConfigService,
    JwtModule,
  ],
})
export class AuthModule {
  // Authentication module
}
