import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainAnalyticsListener } from './blockchain-analytics.listener';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

describe('BlockchainAnalyticsListener', () => {
  let listener: BlockchainAnalyticsListener;
  let analyticsRepository: Partial<
    Record<keyof Repository<AnalyticsEvent>, jest.Mock>
  >;

  beforeEach(async () => {
    analyticsRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainAnalyticsListener,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: analyticsRepository,
        },
      ],
    }).compile();

    listener = module.get<BlockchainAnalyticsListener>(
      BlockchainAnalyticsListener,
    );
  });

  it('persists wallet_linked analytics events', async () => {
    const event = {
      userId: 'user-101',
      walletAddress: 'GABC1234567890',
      entityId: 'GABC1234567890',
      timestamp: new Date('2026-07-25T00:00:00Z'),
    };

    await listener.handleWalletLinked(event);

    expect(analyticsRepository.create).toHaveBeenCalledWith({
      eventType: 'wallet_linked',
      userId: event.userId,
      entityId: event.entityId,
      payload: {
        walletAddress: event.walletAddress,
      },
      timestamp: event.timestamp,
    });
    expect(analyticsRepository.save).toHaveBeenCalled();
  });

  it('persists wallet_link_failed analytics events', async () => {
    const event = {
      userId: 'user-102',
      walletAddress: 'invalid-address',
      reason: 'Invalid or missing wallet address',
      entityId: 'user-102',
      timestamp: new Date('2026-07-25T00:00:00Z'),
    };

    await listener.handleWalletLinkFailed(event);

    expect(analyticsRepository.create).toHaveBeenCalledWith({
      eventType: 'wallet_link_failed',
      userId: event.userId,
      entityId: event.entityId,
      payload: {
        walletAddress: event.walletAddress,
        reason: event.reason,
      },
      timestamp: event.timestamp,
    });
    expect(analyticsRepository.save).toHaveBeenCalled();
  });
});
