import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { IQAssessmentController } from "./controllers/iq-assessment.controller";
import { AdminIqQuestionsController } from "./controllers/admin-iq-questions.controller";

import { IQAssessmentService } from "./providers/iq-assessment.service";
import { IqAttemptService } from "./providers/iq-attempt.service";
import { AdminIqQuestionsService } from "./providers/admin-iq-questions.service";

import { SubmitPuzzleProvider } from "./providers/submit-puzzle.provider";
import { VerifySolutionProvider } from "./providers/verify-solution.provider";
import { UpdateProgressProvider } from "./providers/update-progress.provider";
import { CalculateRewardsProvider } from "./providers/calculate-rewards.provider";
import { UpdateUserStatsProvider } from "./providers/update-user-stats.provider";
import { GetPuzzleProvider } from "./providers/get-puzzle.provider";
import { GetPuzzlesProvider } from "./providers/get-puzzles.provider";

import { IQAssessmentSession } from "./entities/iq-assessment-session.entity";
import { IQQuestion } from "./entities/iq-question.entity";
import { IQAnswer } from "./entities/iq-answer.entity";
import { IqAttempt } from "./entities/iq-attempt.entity";
import { User } from "../users/user.entity";

import { AchievementModule } from "../achievement/achievement.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IQAssessmentSession,
      IQQuestion,
      IQAnswer,
      IqAttempt,
      User,
    ]),
    HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
    AchievementModule,
  ],
  controllers: [IQAssessmentController, AdminIqQuestionsController],
  providers: [
    IQAssessmentService,
    IqAttemptService,
    AdminIqQuestionsService,
    SubmitPuzzleProvider,
    VerifySolutionProvider,
    UpdateProgressProvider,
    CalculateRewardsProvider,
    UpdateUserStatsProvider,
    GetPuzzleProvider,
    GetPuzzlesProvider,
  ],
  exports: [
    IQAssessmentService,
    IqAttemptService,
    AdminIqQuestionsService,
  ],
})
export class IQAssessmentModule {}
