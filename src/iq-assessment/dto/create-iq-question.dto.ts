import { IsString, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize, MinLength, MaxLength } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateIqQuestionDto {
  @ApiProperty({
    description: "The question text",
    example: "What is the next number in the sequence: 2, 4, 8, 16, ?",
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: "Question text must be at least 10 characters long" })
  @MaxLength(1000, { message: "Question text must not exceed 1000 characters" })
  questionText: string

  @ApiProperty({
    description: "Array of answer options",
    example: ["32", "24", "20", "28"],
    minItems: 2,
    maxItems: 6,
  })
  @IsArray()
  @ArrayMinSize(2, { message: "At least 2 options are required" })
  @ArrayMaxSize(6, { message: "Maximum 6 options allowed" })
  @IsString({ each: true })
  options: string[]

  @ApiProperty({
    description: "The correct answer (must match one of the options)",
    example: "32",
  })
  @IsString()
  correctAnswer: string

  @ApiPropertyOptional({
    description: "Optional explanation for the answer",
    example: "Each number is double the previous number: 2×2=4, 4×2=8, 8×2=16, 16×2=32",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Explanation must not exceed 500 characters" })
  explanation?: string
}
