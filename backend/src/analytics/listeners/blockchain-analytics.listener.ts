import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

export interface WalletLinkedEvent {
  userId: string;
  walletAddress: string;
  entityId?: string;
  timestamp?: Date;
}

export interface WalletLinkFailedEvent {
  userId: string;
  walletAddress?: string;
  reason?: string;
  entityId?: string;
  timestamp?: Date;
}

@Injectable()
export class BlockchainAnalyticsListener {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  @OnEvent('wallet_linked')
  async handleWalletLinked(event: WalletLinkedEvent) {
    const analyticsEvent = this.analyticsEventRepository.create({
      eventType: 'wallet_linked',
      userId: event.userId,
      entityId: event.entityId ?? event.walletAddress,
      payload: {
        walletAddress: event.walletAddress,
      },
      timestamp: event.timestamp ?? new Date(),
    });

    await this.analyticsEventRepository.save(analyticsEvent);
  }

  @OnEvent('wallet_link_failed')
  async handleWalletLinkFailed(event: WalletLinkFailedEvent) {
    const analyticsEvent = this.analyticsEventRepository.create({
      eventType: 'wallet_link_failed',
      userId: event.userId,
      entityId: event.entityId ?? event.userId,
      payload: {
        walletAddress: event.walletAddress ?? '',
        reason: event.reason ?? 'Unknown failure',
      },
      timestamp: event.timestamp ?? new Date(),
    });

    await this.analyticsEventRepository.save(analyticsEvent);
  }
}
