import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { ProgressModule } from './progress/progress.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PuzzlesModule } from './puzzles/puzzles.module';
import { QuestsModule } from './quests/quests.module';
import { StreakModule } from './streak/strerak.module';
import { CategoriesModule } from './categories/categories.module';

// const ENV = process.env.NODE_ENV;
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('ENV:', ENV);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      autoLoadEntities: true,
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    UsersModule,
    PuzzlesModule,
    ProgressModule,
    QuestsModule,
    StreakModule,
    CommonModule,
    RedisModule,
    BlockchainModule,
    ProgressModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
