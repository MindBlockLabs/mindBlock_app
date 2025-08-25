import { IsEnum, IsOptional } from 'class-validator';
import { TimeFilter } from '../timefilter.enums/timefilter.enum';

export class TimeFilterDto {
  @IsOptional()
  @IsEnum(TimeFilter)
  filter?: TimeFilter = TimeFilter.ALL_TIME;
}
