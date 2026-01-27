import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Logic',
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the category',
    example: 'Logic and reasoning puzzles',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon URL or identifier for the category',
    example: 'logic-icon.png',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
