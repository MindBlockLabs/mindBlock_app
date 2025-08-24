import { IsOptional, IsString, IsInt, Min, Max } from "class-validator"
import { Type } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"

export class AdminQuestionsQueryDto {
  @ApiPropertyOptional({
    description: "Page number",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({
    description: "Search term to filter questions",
    example: "sequence",
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: "Sort field",
    example: "createdAt",
    enum: ["createdAt", "questionText", "totalAttempts", "successRate"],
  })
  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "questionText" | "totalAttempts" | "successRate" = "createdAt"

  @ApiPropertyOptional({
    description: "Sort order",
    example: "DESC",
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC"
}
