import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class AnswerSubmissionResponseDto {
  @ApiProperty({
    description: "Whether the submitted answer is correct",
    example: true,
  })
  isCorrect: boolean

  @ApiProperty({
    description: "The correct answer",
    example: "32",
  })
  correctAnswer: string

  @ApiPropertyOptional({
    description: "Explanation for the answer (if available)",
    example: "The pattern follows the Fibonacci sequence where each number is the sum of the two preceding ones.",
  })
  explanation?: string

  @ApiPropertyOptional({
    description: "Partial score if part of a quiz (0-100)",
    example: 85,
  })
  score?: number

  @ApiProperty({
    description: "The submitted answer",
    example: "32",
  })
  selectedAnswer: string

  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  questionId: string
} 