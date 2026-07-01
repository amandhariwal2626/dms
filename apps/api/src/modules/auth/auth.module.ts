import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Algorithm } from 'jsonwebtoken';
import { ConfigurationModule } from '@/config/configuration.module';
import type { EnvironmentVariables } from '@/config/env.validation';
import { AuthController } from './controllers/auth.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { ProfileController } from './controllers/profile.controller';
import { InvitationController } from './controllers/invitation.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { RolePermissionController } from './controllers/role-permission.controller';
import { UserRoleController } from './controllers/user-role.controller';
import { EffectivePermissionController } from './controllers/effective-permission.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { PasswordResetService } from './services/password-reset.service';
import { ProfileService } from './services/profile.service';
import { InvitationService } from './services/invitation.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { RolePermissionService } from './services/role-permission.service';
import { InMemoryCacheProvider, PermissionCacheService } from './services/permission-cache.service';
import { CompanyContextResolver } from './services/company-context-resolver.service';
import { RoleResolver } from './services/role-resolver.service';
import { PermissionResolver } from './services/permission-resolver.service';
import { AuthorizationService } from './services/authorization.service';
import { UserRoleService } from './services/user-role.service';
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
  controllers: [
    AuthController,
    PasswordResetController,
    ProfileController,
    InvitationController,
    RoleController,
    PermissionController,
    RolePermissionController,
    UserRoleController,
    EffectivePermissionController,
  ],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    PasswordService,
    PasswordResetService,
    ProfileService,
    InvitationService,
    RoleService,
    PermissionService,
    RolePermissionService,
    InMemoryCacheProvider,
    {
      provide: 'CACHE_PROVIDER',
      useExisting: InMemoryCacheProvider,
    },
    PermissionCacheService,
    CompanyContextResolver,
    RoleResolver,
    PermissionResolver,
    AuthorizationService,
    UserRoleService,
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
    AuthorizationService,
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
