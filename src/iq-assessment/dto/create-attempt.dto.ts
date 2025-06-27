import { IsString, IsUUID, IsBoolean, IsOptional } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateAttemptDto {
  @ApiPropertyOptional({
    description: "User ID (null for anonymous users)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  userId?: string | null

  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  questionId: string

  @ApiProperty({
    description: "Selected answer option",
    example: "32",
  })
  @IsString()
  selectedAnswer: string

  @ApiProperty({
    description: "Correct answer for the question",
    example: "42",
  })
  @IsString()
  correctAnswer: string

  @ApiProperty({
    description: "Whether the answer was correct",
    example: false,
  })
  @IsBoolean()
  isCorrect: boolean
}
