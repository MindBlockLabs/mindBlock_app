import { ApiProperty } from '@nestjs/swagger';

export class EventTypeBreakdown {
  @ApiProperty({
    description: 'The type of analytics event',
    example: 'question_view',
  })
  eventType: string;

  @ApiProperty({
    description: 'The count of events for this type',
    example: 124,
  })
  count: number;

  @ApiProperty({
    description: 'Friendly display name for the event type',
    example: 'Question Viewed',
    required: false,
  })
  displayName?: string;

  @ApiProperty({
    description: 'Percentage of total events (0-100)',
    example: 58.8,
    required: false,
  })
  percentage?: number;
}

export class AnalyticsBreakdownResponse {
  @ApiProperty({
    description: 'Array of event type breakdowns',
    type: [EventTypeBreakdown],
  })
  breakdown: EventTypeBreakdown[];

  @ApiProperty({
    description: 'Total count of all events in the filtered range',
    example: 211,
  })
  totalEvents: number;

  @ApiProperty({
    description: 'Number of unique event types',
    example: 3,
  })
  uniqueEventTypes: number;

  @ApiProperty({
    description: 'Date range of the breakdown data',
    example: '2024-01-01 to 2024-01-31',
  })
  dateRange: string;
} 