import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class AdminQuestionResponseDto {
  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string

  @ApiProperty({
    description: "The question text",
    example: "What is the next number in the sequence: 2, 4, 8, 16, ?",
  })
  questionText: string

  @ApiProperty({
    description: "Array of answer options",
    example: ["32", "24", "20", "28"],
  })
  options: string[]

  @ApiProperty({
    description: "The correct answer",
    example: "32",
  })
  correctAnswer: string

  @ApiPropertyOptional({
    description: "Optional explanation for the answer",
    example: "Each number is double the previous number: 2×2=4, 4×2=8, 8×2=16, 16×2=32",
  })
  explanation?: string

  @ApiProperty({
    description: "Number of times this question has been answered",
    example: 150,
  })
  totalAttempts: number

  @ApiProperty({
    description: "Number of correct answers",
    example: 120,
  })
  correctAttempts: number

  @ApiProperty({
    description: "Success rate percentage",
    example: 80,
  })
  successRate: number
}

export class PaginatedQuestionsResponseDto {
  @ApiProperty({
    description: "Array of questions",
    type: [AdminQuestionResponseDto],
  })
  questions: AdminQuestionResponseDto[]

  @ApiProperty({
    description: "Total number of questions",
    example: 250,
  })
  total: number

  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page: number

  @ApiProperty({
    description: "Number of items per page",
    example: 20,
  })
  limit: number

  @ApiProperty({
    description: "Total number of pages",
    example: 13,
  })
  totalPages: number
}
