import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { UsersModule } from '../users/users.module';
import { SignInProvider } from './providers/sign-in.provider';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import jwtConfig from './authConfig/jwt.config';
import { AuthController } from './controllers/auth.controller';
import { RefreshTokensProvider } from './providers/refreshTokensProvider';
import { GenerateTokensProvider } from './providers/generate-tokens.provider';
import { GoogleAuthenticationService } from './social/providers/google-authentication.service';
import { GoogleAuthenticationController } from './social/google-auth.controller';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { StellarWalletLoginProvider } from './providers/wallet-login.provider';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute globally
      },
    ]),
  ],
  controllers: [AuthController, GoogleAuthenticationController],
  providers: [
    AuthService,
    JwtStrategy,
    SignInProvider,
    RefreshTokensProvider,
    GenerateTokensProvider,
    GoogleAuthenticationService,
    StellarWalletLoginProvider,
    {
      provide: HashingProvider, // Use the abstract class as a token
      useClass: BcryptProvider, // Bind it to the concrete implementation
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [JwtStrategy, AuthService, HashingProvider, GoogleAuthenticationService],
})
export class AuthModule {}
