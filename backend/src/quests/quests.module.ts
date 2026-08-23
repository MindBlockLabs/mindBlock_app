import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyQuest } from './entities/daily-quest.entity';
import { DailyQuestPuzzle } from './entities/daily-quest-puzzle.entity';
import { DailyQuestController } from './controllers/daily-quest.controller';
import { DailyQuestService } from './providers/daily-quest.service';
import { GetTodaysDailyQuestProvider } from './providers/getTodaysDailyQuest.provider';
import { GetTodaysDailyQuestStatusProvider } from './providers/getTodaysDailyQuestStatus.provider';
import { CompleteDailyQuestProvider } from './providers/complete-daily-quest.provider';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { ProgressModule } from '../progress/progress.module';
import { UsersModule } from '../users/users.module';
import { StreakModule } from '../streak/strerak.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyQuest, DailyQuestPuzzle]),
    PuzzlesModule,
    ProgressModule,
    UsersModule,
    StreakModule,
    // BlockchainService is needed by CompleteDailyQuestProvider for
    // syncXpMilestone after the daily quest completion bonus XP is awarded.
    BlockchainModule,
  ],
  controllers: [DailyQuestController],
  providers: [
    DailyQuestService,
    GetTodaysDailyQuestProvider,
    GetTodaysDailyQuestStatusProvider,
    CompleteDailyQuestProvider,
  ],
  exports: [TypeOrmModule, DailyQuestService],
})
export class QuestsModule {}
