import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigurationModule } from '@/config/configuration.module';
import { authConfig } from './config/auth.config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { EmailVerificationService } from './services/email-verification.service';
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
      inject: [authConfig.KEY],
      useFactory: (config: ReturnType<typeof authConfig>) => ({
        secret: config.accessToken.secret,
        signOptions: {
          algorithm: config.accessToken.algorithm as 'HS256' | 'HS384' | 'HS512',
          issuer: config.issuer,
          audience: config.audience,
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
    JwtModule,
  ],
})
export class AuthModule {
  // Authentication module
}
