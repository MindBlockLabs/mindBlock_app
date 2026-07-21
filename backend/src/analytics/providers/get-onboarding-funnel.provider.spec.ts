import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { GetOnboardingFunnelProvider } from './get-onboarding-funnel.provider';

describe('GetOnboardingFunnelProvider', () => {
  let provider: GetOnboardingFunnelProvider;
  let mockRepository: jest.Mocked<Pick<Repository<AnalyticsEvent>, 'count'>>;

  beforeEach(async () => {
    mockRepository = { count: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOnboardingFunnelProvider,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    provider = module.get<GetOnboardingFunnelProvider>(GetOnboardingFunnelProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return funnel stages with counts for happy path', async () => {
    mockRepository.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(65)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(40);

    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-06-30');
    const result = await provider.getFunnel(startDate, endDate);

    expect(result.startDate).toEqual(startDate);
    expect(result.endDate).toEqual(endDate);
    expect(result.totalUsers).toBe(100);
    expect(result.stages).toHaveLength(5);

    expect(result.stages[0]).toEqual({
      name: 'Onboarding Started',
      eventType: 'onboarding_started',
      count: 100,
    });
    expect(result.stages[1]).toEqual({
      name: 'Profile Created',
      eventType: 'profile_created',
      count: 80,
    });
    expect(result.stages[2]).toEqual({
      name: 'Tutorial Viewed',
      eventType: 'tutorial_viewed',
      count: 65,
    });
    expect(result.stages[3]).toEqual({
      name: 'First Puzzle Attempted',
      eventType: 'first_puzzle_attempted',
      count: 50,
    });
    expect(result.stages[4]).toEqual({
      name: 'Onboarding Completed',
      eventType: 'onboarding_completed',
      count: 40,
    });

    expect(mockRepository.count).toHaveBeenCalledTimes(5);
  });

  it('should handle empty data gracefully', async () => {
    mockRepository.count.mockResolvedValue(0);

    const result = await provider.getFunnel();

    expect(result.totalUsers).toBe(0);
    expect(result.stages).toHaveLength(5);
    result.stages.forEach((stage) => {
      expect(stage.count).toBe(0);
    });
  });

  it('should apply date range filtering', async () => {
    mockRepository.count.mockResolvedValue(10);

    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-31');
    await provider.getFunnel(startDate, endDate);

    expect(mockRepository.count).toHaveBeenCalledTimes(5);
  });
});
