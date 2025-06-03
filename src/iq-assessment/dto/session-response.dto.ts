import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class QuestionResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  questionText: string

  @ApiProperty()
  options: string[]

  @ApiPropertyOptional()
  explanation?: string
}

export class SessionProgressDto {
  @ApiProperty()
  currentQuestion: number

  @ApiProperty()
  totalQuestions: number

  @ApiProperty()
  timeElapsed: number // in seconds

  @ApiProperty()
  completed: boolean
}

export class SessionResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  userId: number

  @ApiProperty()
  startTime: Date

  @ApiPropertyOptional()
  endTime?: Date

  @ApiProperty()
  score: number

  @ApiProperty()
  totalQuestions: number

  @ApiProperty()
  completed: boolean

  @ApiProperty()
  progress: SessionProgressDto

  @ApiPropertyOptional()
  currentQuestion?: QuestionResponseDto
}

export class CompletedSessionResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  score: number

  @ApiProperty()
  totalQuestions: number

  @ApiProperty()
  percentage: number

  @ApiProperty()
  timeElapsed: number

  @ApiProperty()
  answers: Array<{
    questionId: string
    questionText: string
    selectedOption?: string
    correctAnswer: string
    isCorrect: boolean
    skipped: boolean
    explanation?: string
  }>
}
