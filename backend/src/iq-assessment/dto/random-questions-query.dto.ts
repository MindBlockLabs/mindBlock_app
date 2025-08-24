import { IsOptional, IsEnum, IsInt, Min, Max } from "class-validator"
import { Type } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { QuestionDifficulty, QuestionCategory } from "../entities/iq-question.entity"

export class RandomQuestionsQueryDto {
  @ApiPropertyOptional({
    description: "Difficulty level of the question",
    enum: QuestionDifficulty,
    example: QuestionDifficulty.EASY,
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional({
    description: "Category of the question",
    enum: QuestionCategory,
    example: QuestionCategory.SCIENCE,
  })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory

  @ApiPropertyOptional({
    description: "Number of questions to return",
    example: 1,
    minimum: 1,
    maximum: 50,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number = 1
} 