import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IQAssessmentController } from './controllers/iq-assessment.controller';
import { IQAssessmentSession } from './entities/iq-assessment-session.entity';
import { IQQuestion } from './entities/iq-question.entity';
import { IQAnswer } from './entities/iq-answer.entity';
import { User } from '../users/user.entity';
import { HttpModule } from '@nestjs/axios';
import { IQAssessmentService } from './providers/iq-assessment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IQAssessmentSession, IQQuestion, IQAnswer, User]),
    HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
  ],
  controllers: [IQAssessmentController],
  providers: [IQAssessmentService],
  exports: [IQAssessmentService],
})
export class IQAssessmentModule {}
