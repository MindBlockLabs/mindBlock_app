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

  describe('PII sanitization', () => {
    const HASH_PATTERN = /^sha256:[0-9a-f]{16}$/;

    /** Mocks create/save as identity passthroughs so the sanitized payload survives to the response. */
    function mockRepositoryAsPassthrough() {
      repository.create.mockImplementation(
        (data: any) => data as AnalyticsEvent,
      );
      repository.save.mockImplementation(async (data: any) => ({
        id: 'evt-uuid-pii',
        ...(data as object),
        timestamp: new Date('2026-08-01T00:00:00.000Z'),
      }));
    }

    it('should strip or hash known PII field names from a deliberately dirty payload before insert', async () => {
      mockRepositoryAsPassthrough();

      const dto: TrackEventDto = {
        eventType: 'profile_updated',
        userId: 'user-pii-1',
        payload: {
          entityId: 'profile-1',
          email: 'jane.doe@example.com',
          walletAddress: '0xAbC1234567890000000000000000000000dEaD',
          password: 'super-secret-password',
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          difficulty: 'hard', // non-PII — must survive untouched
          nested: {
            phoneNumber: '+1-555-123-4567',
            note: 'call me anytime',
          },
        },
      };

      const result = await provider.track(dto);
      const persistedPayload = result.data.payload as Record<string, any>;

      // Non-PII fields, including nested ones, pass through unchanged.
      expect(persistedPayload.entityId).toBe('profile-1');
      expect(persistedPayload.difficulty).toBe('hard');
      expect(persistedPayload.nested.note).toBe('call me anytime');

      // Credentials/secrets are dropped entirely — no analytics value even hashed.
      expect(persistedPayload.password).toBeUndefined();
      expect(persistedPayload.accessToken).toBeUndefined();

      // Correlatable PII is hashed, never stored raw.
      expect(persistedPayload.email).not.toBe('jane.doe@example.com');
      expect(persistedPayload.email).toMatch(HASH_PATTERN);
      expect(persistedPayload.walletAddress).not.toBe(
        '0xAbC1234567890000000000000000000000dEaD',
      );
      expect(persistedPayload.walletAddress).toMatch(HASH_PATTERN);
      expect(persistedPayload.nested.phoneNumber).not.toBe('+1-555-123-4567');
      expect(persistedPayload.nested.phoneNumber).toMatch(HASH_PATTERN);

      // Final sweep: none of the raw sensitive values appear anywhere in
      // what actually gets written, however it's nested.
      const serialized = JSON.stringify(persistedPayload);
      expect(serialized).not.toContain('jane.doe@example.com');
      expect(serialized).not.toContain(
        '0xAbC1234567890000000000000000000000dEaD',
      );
      expect(serialized).not.toContain('super-secret-password');
      expect(serialized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(serialized).not.toContain('+1-555-123-4567');
    });

    it('should hash PII field names case-insensitively', async () => {
      mockRepositoryAsPassthrough();

      const dto: TrackEventDto = {
        eventType: 'signup_completed',
        userId: 'user-pii-2',
        payload: { Email: 'Weird.Casing@Example.com', WALLETADDRESS: '0xdead' },
      };

      const result = await provider.track(dto);
      const persistedPayload = result.data.payload as Record<string, any>;

      expect(persistedPayload.Email).toMatch(HASH_PATTERN);
      expect(persistedPayload.WALLETADDRESS).toMatch(HASH_PATTERN);
    });

    it('should hash the same raw value to the same hash deterministically, enabling correlation without exposing PII', async () => {
      mockRepositoryAsPassthrough();

      const makeDto = (): TrackEventDto => ({
        eventType: 'wallet_connected',
        userId: 'user-1',
        payload: {
          walletAddress: '0xSAMEADDRESS0000000000000000000000000000',
        },
      });

      const first = await provider.track(makeDto());
      const second = await provider.track(makeDto());

      const firstPayload = first.data.payload as Record<string, any>;
      const secondPayload = second.data.payload as Record<string, any>;

      expect(firstPayload.walletAddress).toBe(secondPayload.walletAddress);
      expect(firstPayload.walletAddress).toMatch(HASH_PATTERN);
    });

    it('should leave a payload with no PII fields completely unaffected', async () => {
      mockRepositoryAsPassthrough();

      const dto: TrackEventDto = {
        eventType: 'puzzle_attempted',
        userId: 'user-clean',
        payload: { entityId: 'puzzle-1', difficulty: 'easy', timeSpent: 12 },
      };

      const result = await provider.track(dto);

      expect(result.data.payload).toEqual(dto.payload);
    });

    it('should return undefined payload unchanged when no payload is provided', async () => {
      mockRepositoryAsPassthrough();

      const dto: TrackEventDto = { eventType: 'session_started' };

      const result = await provider.track(dto);

      expect(result.data.payload).toBeUndefined();
    });
  });
});
