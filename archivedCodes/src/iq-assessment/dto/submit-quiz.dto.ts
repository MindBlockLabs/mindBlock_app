import { IsArray, IsUUID, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizResponseDto {
  @IsUUID()
  questionId: string;

  selectedAnswer: string;
}

export class SubmitQuizDto {
  @IsOptional()
  @IsUUID()
  quizSessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizResponseDto)
  responses: QuizResponseDto[];
}