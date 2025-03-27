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
import { BlockchainController } from './controller/controller/blockchain/blockchain.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production', // Adjust synchronization based on environment
      }),
    }),
    AuthModule,
    UsersModule,
    LeaderboardModule,
    CommonModule,
    BlockchainModule,
  ],
  controllers: [UsersController, LeaderboardController, BlockchainController],
  providers: [UsersService],
})
export class AppModule {}