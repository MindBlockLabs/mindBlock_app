import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { IQAssessmentController } from "./controllers/iq-assessment.controller"
import { IQAssessmentSession } from "./entities/iq-assessment-session.entity"
import { IQQuestion } from "./entities/iq-question.entity"
import { IQAnswer } from "./entities/iq-answer.entity"
import { User } from "../users/user.entity"
import { IQAssessmentService } from "./providers/iq-assessment.service"

@Module({
  imports: [TypeOrmModule.forFeature([IQAssessmentSession, IQQuestion, IQAnswer, User])],
  controllers: [IQAssessmentController],
  providers: [IQAssessmentService],
  exports: [IQAssessmentService],
})
export class IQAssessmentModule {}
