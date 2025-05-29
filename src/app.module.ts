import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/controllers/users.controller';
import { UsersService } from './users/providers/users.service';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardController } from './leaderboard/controllers/leaderboard.controller';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { BlockchainController } from './blockchain/controller/blockchain.controller';
import { AppService } from './app.service';


const ENV = process.env.NODE_ENV;
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ENV:', ENV);
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [!ENV ? '.env' : `.env.${ENV.trim()}`],
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        synchronize: configService.get('database.synchronize'),
        autoLoadEntities: configService.get('database.autoload'),
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