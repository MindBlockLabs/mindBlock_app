import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { QuestionDifficulty, QuestionCategory } from "../entities/iq-question.entity"

export class RandomQuestionResponseDto {
  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  id: string

  @ApiProperty({
    description: "Question text",
    example: "What is the next number in the sequence: 2, 4, 8, 16, ...?",
  })
  questionText: string

  @ApiProperty({
    description: "Available answer options (shuffled)",
    example: ["32", "24", "30", "28"],
    type: [String],
  })
  options: string[]

  @ApiProperty({
    description: "Difficulty level of the question",
    enum: QuestionDifficulty,
    example: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty

  @ApiPropertyOptional({
    description: "Category of the question",
    enum: QuestionCategory,
    example: QuestionCategory.MATHEMATICS,
  })
  category?: QuestionCategory
} 