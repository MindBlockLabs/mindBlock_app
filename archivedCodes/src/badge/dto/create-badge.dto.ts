import { IsString, IsNumber, IsOptional, IsBoolean, MinLength, Min } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateBadgeDto {
  @ApiProperty({ description: "Badge title", example: "Puzzle Master" })
  @IsString()
  @MinLength(1)
  title: string

  @ApiProperty({ description: "Badge description", example: "Awarded to top performers" })
  @IsString()
  @MinLength(1)
  description: string

  @ApiPropertyOptional({ description: "Badge icon URL" })
  @IsOptional()
  @IsString()
  iconUrl?: string

  @ApiProperty({ description: "Badge rank for sorting", example: 1 })
  @IsNumber()
  @Min(1)
  rank: number

  @ApiPropertyOptional({ description: "Whether badge is active", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ description: "Whether badge is auto-assigned", default: false })
  @IsOptional()
  @IsBoolean()
  isAutoAssigned?: boolean
}
