import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/controllers/users.controller';
import { UsersService } from './users/providers/users.service';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardController } from './leaderboard/controllers/leaderboard.controller';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { BlockchainController } from './blockchain/controller/blockchain.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        // entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: configService.get('DATABASE_LOAD'),
        synchronize: configService.get('DATABASE_SYNC')
      }),
    }),
    AuthModule,
    UsersModule,
    LeaderboardModule,
    CommonModule,
    BlockchainModule,
  ],
  controllers: [UsersController, LeaderboardController, BlockchainController],
  providers: [AppService],
})
export class AppModule {}