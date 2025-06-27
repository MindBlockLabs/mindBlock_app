import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { IQAssessmentController } from "./controllers/iq-assessment.controller"
import { IQAssessmentSession } from "./entities/iq-assessment-session.entity"
import { IQQuestion } from "./entities/iq-question.entity"
import { IQAnswer } from "./entities/iq-answer.entity"
import { IqAttempt } from "./entities/iq-attempt.entity"
import { User } from "../users/user.entity"
import { HttpModule } from "@nestjs/axios"
import { IQAssessmentService } from "./providers/iq-assessment.service"
import { IqAttemptService } from "./providers/iq-attempt.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([IQAssessmentSession, IQQuestion, IQAnswer, IqAttempt, User]),
    HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
  ],
  controllers: [IQAssessmentController],
  providers: [IQAssessmentService, IqAttemptService],
  exports: [IQAssessmentService, IqAttemptService],
})
export class IQAssessmentModule {}
