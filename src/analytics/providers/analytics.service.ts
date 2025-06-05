import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  async create(dto: CreateAnalyticsEventDto): Promise<AnalyticsEvent> {
    const event = this.analyticsRepo.create(dto);
    return this.analyticsRepo.save(event);
  }

  async findAll(): Promise<AnalyticsEvent[]> {
    return this.analyticsRepo.find({ order: { createdAt: 'DESC' } });
  }
}