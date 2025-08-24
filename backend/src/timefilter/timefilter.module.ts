import { Module } from '@nestjs/common';
import { TimeFilterService } from './providers/timefilter.service';


@Module({
  providers: [TimeFilterService],
  exports: [TimeFilterService],
})
export class TimeFilterModule {}