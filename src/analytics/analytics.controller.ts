import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { TimeFilter } from 'src/timefilter/timefilter.enum.ts/timefilter.enum';
import { AnalyticsService } from './providers/analytics.service';

@Controller('analytics')
// @UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // @Get()
  // findAll(query: GetAnalyticsQueryDto) {
  //   return this.analyticsService.findAll(query);
  // }

  @Get()
  @ApiQuery({ name: 'timeFilter', enum: TimeFilter, required: false })
  async getAnalytics(@Query() query: GetAnalyticsQueryDto) {
    return this.analyticsService.findAll(query);
}
}