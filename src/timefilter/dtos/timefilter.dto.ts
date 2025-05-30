import { IsEnum, IsOptional } from 'class-validator';
import { TimeFilter } from '../timefilter.enum.ts/timefilter.enum';



export class TimeFilterDto {
  @IsOptional()
  @IsEnum(TimeFilter)
  filter?: TimeFilter = TimeFilter.ALL_TIME;
}