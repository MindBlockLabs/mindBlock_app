import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { UsersModule } from 'src/users/users.module';
import { SignInProvider } from './providers/sign-in.provider';
import { ConfigModule } from '@nestjs/config';
import{ JwtModule } from '@nestjs/jwt'
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import jwtConfig from './authConfig/jwt.config';
import { AuthController } from './controllers/auth.controller';
import { RefreshTokensProvider } from './providers/refreshTokensProvider';
import { GenerateTokensProvider } from './providers/generate-tokens.provider';

@Module({
  imports: [forwardRef(() => UsersModule), 
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider())],
  controllers: [AuthController],
  providers: [AuthService, 
    {
      provide: HashingProvider, // Use the abstract class as a token
      useClass: BcryptProvider, // Bind it to the concrete implementation
    }, 
    SignInProvider,
    RefreshTokensProvider,
    GenerateTokensProvider
  ],
  exports: [AuthService, HashingProvider]
})
export class AuthModule {}