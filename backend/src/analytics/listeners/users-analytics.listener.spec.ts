import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersAnalyticsListener } from './users-analytics.listener';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

describe('UsersAnalyticsListener', () => {
  let listener: UsersAnalyticsListener;
  let analyticsRepository: Partial<Record<keyof Repository<AnalyticsEvent>, jest.Mock>>;

  beforeEach(async () => {
    analyticsRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersAnalyticsListener,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: analyticsRepository },
      ],
    }).compile();

    listener = module.get<UsersAnalyticsListener>(UsersAnalyticsListener);
  });

  it('persists xp_awarded analytics events', async () => {
    const event = {
      userId: 'user-1',
      entityId: 'user-1',
      xpAmount: 150,
      previousLevel: 1,
      currentLevel: 1,
      timestamp: new Date('2026-07-20T00:00:00Z'),
    };

    await listener.handleXpAwarded(event);

    expect(analyticsRepository.create).toHaveBeenCalledWith({
      eventType: 'xp_awarded',
      userId: event.userId,
      entityId: event.entityId,
      payload: {
        xpAmount: event.xpAmount,
        previousLevel: event.previousLevel,
        currentLevel: event.currentLevel,
      },
      timestamp: event.timestamp,
    });
    expect(analyticsRepository.save).toHaveBeenCalled();
  });

  it('persists user_leveled_up analytics events', async () => {
    const event = {
      userId: 'user-2',
      entityId: 'user-2',
      previousLevel: 1,
      currentLevel: 2,
      timestamp: new Date('2026-07-20T00:00:00Z'),
    };

    await listener.handleUserLeveledUp(event);

    expect(analyticsRepository.create).toHaveBeenCalledWith({
      eventType: 'user_leveled_up',
      userId: event.userId,
      entityId: event.entityId,
      payload: {
        previousLevel: event.previousLevel,
        currentLevel: event.currentLevel,
      },
      timestamp: event.timestamp,
    });
    expect(analyticsRepository.save).toHaveBeenCalled();
  });
});
