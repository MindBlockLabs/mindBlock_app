import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { TrackEventDto } from '../dtos/track-event.dto';

@Injectable()
export class TrackEventProvider {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  async track(dto: TrackEventDto) {
    const event = this.analyticsEventRepository.create({
      eventType: dto.eventType,
      userId: dto.userId ?? '',
      entityId: dto.payload?.entityId ?? '',
      payload: dto.payload,
    });

    const saved = await this.analyticsEventRepository.save(event);

    return {
      success: true,
      message: 'Event tracked successfully',
      data: saved,
    };
  }
}
