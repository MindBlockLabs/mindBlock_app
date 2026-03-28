import { ApiProperty } from '@nestjs/swagger';
import { ProgressHistoryDto } from './progress-history.dto';

export class PaginatedProgressDto {
  @ApiProperty({
    type: [ProgressHistoryDto],
    description: 'Array of progress history records',
  })
  data: ProgressHistoryDto[];

  @ApiProperty({
    example: {
      itemsPerPage: 10,
      totalItems: 150,
      currentPage: 1,
      totalPages: 15,
    },
    description: 'Pagination metadata',
  })
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };

  @ApiProperty({
    example: {
      first: 'http://localhost:3000/progress?limit=10&page=1',
      last: 'http://localhost:3000/progress?limit=10&page=15',
      current: 'http://localhost:3000/progress?limit=10&page=1',
      previous: 'http://localhost:3000/progress?limit=10&page=1',
      next: 'http://localhost:3000/progress?limit=10&page=2',
    },
    description: 'Navigation links for pagination',
  })
  links: {
    first: string;
    last: string;
    current: string;
    previous: string;
    next: string;
  };
}
