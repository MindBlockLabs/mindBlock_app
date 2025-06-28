import { IsString, IsUUID, IsOptional, IsBoolean } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class SubmitAnswerDto {
  @ApiPropertyOptional({
    description: "Session ID (optional for standalone submissions)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string

  @ApiProperty({
    description: "Question ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  questionId: string

  @ApiPropertyOptional({
    description: "Selected answer option",
    example: "32",
  })
  @IsOptional()
  @IsString()
  selectedOption?: string

  @ApiPropertyOptional({
    description: "Whether the question was skipped",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean = false
}

export class StandaloneSubmitAnswerDto {
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
}
