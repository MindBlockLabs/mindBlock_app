import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class AttemptResponseDto {
  @ApiProperty()
  id: string

  @ApiPropertyOptional()
  userId?: string | null

  @ApiProperty()
  questionId: string

  @ApiProperty()
  selectedAnswer: string

  @ApiProperty()
  correctAnswer: string

  @ApiProperty()
  isCorrect: boolean

  @ApiProperty()
  createdAt: Date

  @ApiPropertyOptional()
  questionText?: string
}

export class UserAttemptsStatsDto {
  @ApiProperty()
  totalAttempts: number

  @ApiProperty()
  correctAttempts: number

  @ApiProperty()
  incorrectAttempts: number

  @ApiProperty()
  accuracyPercentage: number

  @ApiProperty()
  lastAttemptDate?: Date
}
