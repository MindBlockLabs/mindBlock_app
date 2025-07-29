import { ApiProperty } from '@nestjs/swagger';
import { UserActivityEventDto } from './user-activity-event.dto';

export class UserActivityResponseDto {
  @ApiProperty({ type: [UserActivityEventDto] })
  activities: UserActivityEventDto[];
}