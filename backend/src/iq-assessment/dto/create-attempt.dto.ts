import { IsString, IsBoolean, IsOptional, IsUUID } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateAttemptDto {
  @ApiPropertyOptional({
    description: "User ID (nullable for anonymous users)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  questionId: string

  @ApiProperty({
    description: "Selected answer",
    example: "32",
  })
  @IsString()
  selectedAnswer: string

  @ApiProperty({
    description: "Correct answer",
    example: "32",
  })
  @IsString()
  correctAnswer: string

  @ApiProperty({
    description: "Whether the answer is correct",
    example: true,
  })
  @IsBoolean()
  isCorrect: boolean
}
