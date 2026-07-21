import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

@Injectable()
export class TrackEventProvider implements OnModuleDestroy {
  private buffer: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {
    this.flushInterval = setInterval(
      () => this.flush(),
      this.FLUSH_INTERVAL_MS,
    );
  }

  async track(eventData: Partial<AnalyticsEvent>): Promise<void> {
    const entity = this.analyticsEventRepository.create(eventData);
    this.buffer.push(entity);

    if (this.buffer.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await this.analyticsEventRepository.save(batch);
    } catch (error) {
      this.buffer.unshift(...batch);
      throw error;
    }
  }

  onModuleDestroy() {
    clearInterval(this.flushInterval);
  }
}
