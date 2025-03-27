import { Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { SocialController } from './social/social.controller';
import { GoogleStrategy } from './social/google.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SocialController],
  providers: [
    AuthService,
    {
      provide: GoogleStrategy,
      useFactory: (authService: AuthService, configService: ConfigService) => {
        return new GoogleStrategy(authService, configService);
      },
      inject: [AuthService, ConfigService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
