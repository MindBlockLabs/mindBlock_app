import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/controllers/users.controller';
import { UsersService } from './users/providers/users.service';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardController } from './leaderboard/controllers/leaderboard.controller';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'your_username',
      password: process.env.DB_PASSWORD || 'your_password',
      database: process.env.DB_NAME || 'your_database',
      autoLoadEntities: true, // Automatically load entities 
      synchronize: true, // Set to false in production environments
    }),
    AuthModule,
    UsersModule,
    LeaderboardModule,
    CommonModule,
  ],
  controllers: [UsersController, LeaderboardController],
  providers: [UsersService],
})
export class AppModule {}