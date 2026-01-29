import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { paginationQueryDto } from '../../common/pagination/paginationQueryDto';
import { GetProgressHistoryProvider } from '../providers/get-progress-history.provider';
import { GetCategoryStatsProvider } from '../providers/get-category-stats.provider';
import { GetOverallStatsProvider } from '../providers/get-overall-stats.provider';
import { PaginatedProgressDto } from '../dtos/paginated-progress.dto';
import { CategoryStatsDto } from '../dtos/category-stats.dto';
import { OverallStatsDto } from '../dtos/overall-stats.dto';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';
import { ActiveUserData } from '../../auth/interfaces/activeInterface';

@Controller('progress')
@ApiTags('Progress')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProgressController {
  constructor(
    private readonly getProgressHistoryProvider: GetProgressHistoryProvider,
    private readonly getCategoryStatsProvider: GetCategoryStatsProvider,
    private readonly getOverallStatsProvider: GetOverallStatsProvider,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated progress history',
    description:
      'Retrieve user answer history ordered by most recent attempts first',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated progress history',
    type: PaginatedProgressDto,
  })
  async getProgressHistory(
    @ActiveUser() user: ActiveUserData,
    @Query() paginationDto: paginationQueryDto,
  ) {
    if (!user || !user.sub) {
      throw new BadRequestException('User not found');
    }

    const { limit = 10, page = 1 } = paginationDto;
    return this.getProgressHistoryProvider.getProgressHistory(
      user.sub,
      page,
      limit,
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get overall user statistics',
    description:
      'Retrieve total attempts, correct answers, accuracy, points earned, and time spent',
  })
  @ApiResponse({
    status: 200,
    description: 'Overall user statistics',
    type: OverallStatsDto,
  })
  async getOverallStats(@ActiveUser() user: ActiveUserData) {
    if (!user || !user.sub) {
      throw new BadRequestException('User not found');
    }

    return this.getOverallStatsProvider.getOverallStats(user.sub);
  }

  @Get('category/:id')
  @ApiOperation({
    summary: 'Get category-specific statistics',
    description:
      'Retrieve total attempts, correct answers, and accuracy for a specific category',
  })
  @ApiResponse({
    status: 200,
    description: 'Category statistics',
    type: CategoryStatsDto,
  })
  async getCategoryStats(
    @ActiveUser() user: ActiveUserData,
    @Param('id') categoryId: string,
  ) {
    if (!user || !user.sub) {
      throw new BadRequestException('User not found');
    }

    if (!categoryId) {
      throw new BadRequestException('Category ID is required');
    }

    return this.getCategoryStatsProvider.getCategoryStats(user.sub, categoryId);
  }
}
