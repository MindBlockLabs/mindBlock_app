import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { TimeFilterService } from '../../timefilter/providers/timefilter.service';
import { CreateAnalyticsEventDto } from '../dto/create-analytics-event.dto';
import { TimeFilter } from '../../timefilter/timefilter.enums/timefilter.enum';
import { GetAnalyticsQueryDto } from '../dto/get-analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,

    private timeFilterService: TimeFilterService,
  ) {}

  public async findAll(query: GetAnalyticsQueryDto): Promise<AnalyticsEvent[]> {
    const { from, to } = this.timeFilterService.resolveDateRange(
      query.timeFilter,
      query.from,
      query.to,
    );

    const qb = this.analyticsRepo.createQueryBuilder('event');

    if (from) {
      qb.andWhere('event.createdAt >= :from', { from });
    }

    if (to) {
      qb.andWhere('event.createdAt <= :to', { to });
    }

    return qb.orderBy('event.createdAt', 'DESC').getMany();
  }

  public async create(dto: CreateAnalyticsEventDto): Promise<AnalyticsEvent> {
    const event = this.analyticsRepo.create(dto);
    return this.analyticsRepo.save(event);
  }

  resolveDateRange(
    timeFilter?: TimeFilter,
    fromStr?: string,
    toStr?: string,
  ): { from?: Date; to?: Date } {
    if (fromStr && toStr) {
      const from = new Date(fromStr);
      const to = new Date(toStr);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      if (from > to) {
        throw new BadRequestException(
          `'from' date must be earlier than 'to' date`,
        );
      }

      return { from, to };
    }

    if (timeFilter !== undefined) {
      const range = this.timeFilterService.getDateRange(timeFilter);
      return range ? { from: range.from } : {};
    }

    return {};
  }

  public async getAnalytics(query: GetAnalyticsQueryDto) {
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.sessionId) {
      where.sessionId = query.sessionId;
    }

    return this.analyticsRepo.find({ where });
  }
}
