import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionCategory, QuestionDifficulty } from '../entities/iq-question.entity';

export class StartQuizDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  numberOfQuestions: number = 10;

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;
}