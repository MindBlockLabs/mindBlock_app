import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStreakDto {
  @ApiPropertyOptional({
    description:
      'IANA timezone identifier used to calculate current day (e.g., "America/New_York").',
    example: 'America/Los_Angeles',
  })
  @IsOptional()
  @IsString()
  timeZone?: string;
}
