import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class AttemptResponseDto {
  @ApiProperty({
    description: "Attempt ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string

  @ApiPropertyOptional({
    description: "User ID (null for anonymous users)",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  userId?: string

  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  questionId: string

  @ApiPropertyOptional({
    description: "Question text",
    example: "What is the next number in the sequence: 2, 4, 8, 16, ?",
  })
  questionText?: string

  @ApiProperty({
    description: "Selected answer",
    example: "32",
  })
  selectedAnswer: string

  @ApiProperty({
    description: "Correct answer",
    example: "32",
  })
  correctAnswer: string

  @ApiProperty({
    description: "Whether the answer is correct",
    example: true,
  })
  isCorrect: boolean

  @ApiProperty({
    description: "When the attempt was made",
    example: "2024-01-15T10:30:00.000Z",
  })
  createdAt: Date

  @ApiPropertyOptional({
    description: "User name (if available)",
    example: "John Doe",
  })
  userName?: string
}

export class UserAttemptsStatsDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  userId: string

  @ApiProperty({
    description: "Total number of attempts",
    example: 150,
  })
  totalAttempts: number

  @ApiProperty({
    description: "Number of correct attempts",
    example: 120,
  })
  correctAttempts: number

  @ApiProperty({
    description: "Number of incorrect attempts",
    example: 30,
  })
  incorrectAttempts: number

  @ApiProperty({
    description: "Accuracy percentage",
    example: 80,
  })
  accuracyPercentage: number

  @ApiPropertyOptional({
    description: "Date of last attempt",
    example: "2024-01-15T10:30:00.000Z",
  })
  lastAttemptDate?: Date
}
