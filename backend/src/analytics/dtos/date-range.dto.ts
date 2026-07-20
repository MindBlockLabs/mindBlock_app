import { IsDate, IsOptional, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidDateRangeConstraint } from '../validators/date-range.validator';

export class DateRangeDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics queries',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  start?: Date;

  @ApiPropertyOptional({
    description: 'End date for analytics queries',
    example: '2026-06-30T23:59:59.000Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  end?: Date;

  @Validate(ValidDateRangeConstraint)
  _dateRange: boolean;
}
