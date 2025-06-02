import { IsNumber, IsOptional, Min, Max } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateSessionDto {
  @ApiProperty({
    description: "User ID taking the assessment",
    example: 1,
  })
  @IsNumber()
  userId: number

  @ApiPropertyOptional({
    description: "Number of questions for the session",
    example: 8,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  totalQuestions?: number = 8
}
