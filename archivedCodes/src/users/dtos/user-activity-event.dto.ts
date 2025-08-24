import { ApiProperty } from '@nestjs/swagger';

export class UserActivityEventDto {
  @ApiProperty({ example: 'Completed "Binary Tree Maximum Depth" puzzle' })
  description: string;

  @ApiProperty({ example: '2025-07-05T08:00:00Z' })
  timestamp: string;
}