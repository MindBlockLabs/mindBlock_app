import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './entities/game-session.entity';
import { GameSessionsService } from './providers/game-sessions.service';
import { GameSessionsController } from './controllers/game-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameSession])],
  controllers: [GameSessionsController],
  providers: [GameSessionsService],
  exports: [GameSessionsService],
})
export class GameSessionsModule {}
