import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackEventProvider } from './track-event.provider';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { TrackEventDto } from '../dtos/track-event.dto';

describe('TrackEventProvider', () => {
  let provider: TrackEventProvider;
  let repository: jest.Mocked<Repository<AnalyticsEvent>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackEventProvider,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    provider = module.get<TrackEventProvider>(TrackEventProvider);
    repository = module.get(getRepositoryToken(AnalyticsEvent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('happy path', () => {
    it('should create and save a fully populated event, returning a success response', async () => {
      const dto: TrackEventDto = {
        eventType: 'puzzle_attempted',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        payload: {
          entityId: 'puzzle-42',
          difficulty: 'hard',
          timeSpent: 45,
        },
      };

      const createdEntity = {
        eventType: dto.eventType,
        userId: dto.userId,
        entityId: 'puzzle-42',
        payload: dto.payload,
      } as AnalyticsEvent;

      const savedEntity = {
        id: 'evt-uuid-1',
        ...createdEntity,
        timestamp: new Date('2026-07-15T10:00:00.000Z'),
      } as AnalyticsEvent;

      repository.create.mockReturnValue(createdEntity);
      repository.save.mockResolvedValue(savedEntity);

      const result = await provider.track(dto);

      expect(repository.create).toHaveBeenCalledWith({
        eventType: 'puzzle_attempted',
        userId: dto.userId,
        entityId: 'puzzle-42',
        payload: dto.payload,
      });
      expect(repository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual({
        success: true,
        message: 'Event tracked successfully',
        data: savedEntity,
      });
    });
  });

  describe('empty data edge case', () => {
    it('should default userId and entityId to empty strings when userId and payload are omitted', async () => {
      const dto: TrackEventDto = {
        eventType: 'session_started',
      };

      const createdEntity = {
        eventType: 'session_started',
        userId: '',
        entityId: '',
        payload: undefined,
      } as AnalyticsEvent;

      const savedEntity = {
        id: 'evt-uuid-2',
        ...createdEntity,
        timestamp: new Date('2026-07-15T10:05:00.000Z'),
      } as AnalyticsEvent;

      repository.create.mockReturnValue(createdEntity);
      repository.save.mockResolvedValue(savedEntity);

      const result = await provider.track(dto);

      expect(repository.create).toHaveBeenCalledWith({
        eventType: 'session_started',
        userId: '',
        entityId: '',
        payload: undefined,
      });
      expect(repository.save).toHaveBeenCalledWith(createdEntity);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(savedEntity);
    });

    it('should default entityId to an empty string when payload has no entityId', async () => {
      const dto: TrackEventDto = {
        eventType: 'page_viewed',
        userId: 'user-abc',
        payload: { page: '/dashboard' },
      };

      const createdEntity = {
        eventType: 'page_viewed',
        userId: 'user-abc',
        entityId: '',
        payload: dto.payload,
      } as AnalyticsEvent;

      repository.create.mockReturnValue(createdEntity);
      repository.save.mockResolvedValue({
        id: 'evt-uuid-3',
        ...createdEntity,
        timestamp: new Date(),
      } as AnalyticsEvent);

      await provider.track(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: '' }),
      );
    });
  });

  /**
   * "Boundary date-range" note:
   * TrackEventProvider.track() has no date-range query — `timestamp` is a
   * @CreateDateColumn set by TypeORM, not the DTO. The realistic boundary
   * risk here is a caller passing an edge-case date *inside the payload*
   * (year-end instant, Unix epoch, etc.) and the provider mangling or
   * dropping it during create/save. These tests confirm such values pass
   * through untouched.
   */
  describe('boundary date-range case', () => {
    it('should pass through a payload date at the exact year-end boundary unchanged', async () => {
      const boundaryDate = '2026-12-31T23:59:59.999Z';
      const dto: TrackEventDto = {
        eventType: 'streak_completed',
        userId: 'user-xyz',
        payload: {
          entityId: 'streak-1',
          completedAt: boundaryDate,
        },
      };

      const createdEntity = {
        eventType: 'streak_completed',
        userId: 'user-xyz',
        entityId: 'streak-1',
        payload: dto.payload,
      } as AnalyticsEvent;

      const savedEntity = {
        id: 'evt-uuid-4',
        ...createdEntity,
        timestamp: new Date('2027-01-01T00:00:00.000Z'),
      } as AnalyticsEvent;

      repository.create.mockReturnValue(createdEntity);
      repository.save.mockResolvedValue(savedEntity);

      const result = await provider.track(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ completedAt: boundaryDate }),
        }),
      );
      expect(result.data.payload).toEqual(
        expect.objectContaining({ completedAt: boundaryDate }),
      );
    });

    it('should pass through a payload date at the Unix epoch boundary unchanged', async () => {
      const epochDate = '1970-01-01T00:00:00.000Z';
      const dto: TrackEventDto = {
        eventType: 'legacy_event_imported',
        userId: 'user-legacy',
        payload: {
          entityId: 'legacy-1',
          originalTimestamp: epochDate,
        },
      };

      const createdEntity = {
        eventType: 'legacy_event_imported',
        userId: 'user-legacy',
        entityId: 'legacy-1',
        payload: dto.payload,
      } as AnalyticsEvent;

      repository.create.mockReturnValue(createdEntity);
      repository.save.mockResolvedValue({
        id: 'evt-uuid-5',
        ...createdEntity,
        timestamp: new Date(),
      } as AnalyticsEvent);

      const result = await provider.track(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ originalTimestamp: epochDate }),
        }),
      );
      expect(result.data.payload).toEqual(
        expect.objectContaining({ originalTimestamp: epochDate }),
      );
    });
  });
});
