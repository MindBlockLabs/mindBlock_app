// question.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './question.entity';
import { TestSession } from '../test-session/test-session.entity';
import { QuestionService } from './question.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, TestSession])],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
