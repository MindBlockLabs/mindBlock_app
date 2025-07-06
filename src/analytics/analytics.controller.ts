import { Controller, Get, Query, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { ExportAnalyticsQueryDto, ExportFormat } from './dto/export-analytics-query.dto';
import { AnalyticsBreakdownResponse } from './dto/analytics-breakdown-response.dto';
import { TimeFilter } from 'src/timefilter/timefilter.enum.ts/timefilter.enum';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsExportService } from './providers/analytics-export.service';
import { AnalyticsBreakdownService } from './providers/analytics-breakdown.service';
import { RoleDecorator } from '../auth/decorators/role-decorator';
import { Role } from '../auth/enum/roles.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { authType } from '../auth/enum/auth-type.enum';

@ApiTags('Analytics')
@Controller('analytics')
@Auth(authType.Bearer)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsExportService: AnalyticsExportService,
    private readonly analyticsBreakdownService: AnalyticsBreakdownService,
  ) {}

  // @Get()
  // findAll(query: GetAnalyticsQueryDto) {
  //   return this.analyticsService.findAll(query);
  // }

  @Get('analytics')
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (UUID)',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    description: 'Filter by session ID (UUID)',
  })
  async getAnalytics(@Query() query: GetAnalyticsQueryDto) {
    return this.analyticsService.getAnalytics(query);
  }

  @Get('breakdown')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get analytics breakdown by event type',
    description: 'Returns distribution of analytics events by type, suitable for pie charts and bar charts. Supports filtering by date range, user, and session.'
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    description: 'Time filter for data range (weekly, monthly, all_time)',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (UUID)',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    description: 'Filter by session ID (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics breakdown retrieved successfully',
    type: AnalyticsBreakdownResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - Invalid parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid token required',
  })
  async getBreakdown(@Query() query: GetAnalyticsQueryDto): Promise<AnalyticsBreakdownResponse> {
    return this.analyticsBreakdownService.getBreakdown(query);
  }

  @Get('breakdown/top')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get top event types by count',
    description: 'Returns the top N most frequent event types, ordered by count descending.'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top event types to return (default: 10, max: 50)',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    description: 'Time filter for data range',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date in ISO format',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (UUID)',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    description: 'Filter by session ID (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top event types retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          eventType: { type: 'string' },
          count: { type: 'number' },
          displayName: { type: 'string' },
          percentage: { type: 'number' },
        },
      },
    },
  })
  async getTopEventTypes(
    @Query('limit') limit?: number,
    @Query() query?: GetAnalyticsQueryDto,
  ) {
    const safeLimit = Math.min(Math.max(limit || 10, 1), 50); // Clamp between 1 and 50
    return this.analyticsBreakdownService.getTopEventTypes(safeLimit, query || {});
  }

  @Get('breakdown/event-types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get available event types',
    description: 'Returns a list of all available event types in the analytics system.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available event types retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  async getAvailableEventTypes(): Promise<string[]> {
    return this.analyticsBreakdownService.getAvailableEventTypes();
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @RoleDecorator(Role.Admin)
  @ApiOperation({ 
    summary: 'Export analytics data',
    description: 'Export analytics data in CSV or PDF format. Admin only access.'
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ExportFormat,
    default: ExportFormat.CSV,
    description: 'Export format (csv or pdf)',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    description: 'Time filter for data range',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date in ISO format',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (UUID)',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    description: 'Filter by session ID (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - Invalid parameters',
  })
  async exportAnalytics(
    @Query() query: ExportAnalyticsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    // Get filtered analytics data
    const data = await this.analyticsService.findAll(query);
    
    // Export data in requested format
    await this.analyticsExportService.exportAnalytics(
      data,
      query.format || ExportFormat.CSV,
      res,
    );
  }
}
