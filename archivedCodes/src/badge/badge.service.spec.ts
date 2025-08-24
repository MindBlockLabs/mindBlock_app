import { Test, TestingModule } from '@nestjs/testing';
import { BadgeService } from './badge.service';
import { SeedDefaultBadgesService } from './providers/seed-default-badges.service';
import { DetermineBadgeForRankService } from './providers/determine-badge-for-rank.service';
import { AutoAssignBadgesService } from './providers/auto-assign-badges.service';
import { GetBadgeByRankService } from './providers/get-badge-by-rank.service';
import { RemoveBadgeService } from './providers/remove-badge.service';
import { UpdateBadgeService } from './providers/update-badge.service';
import { CreateBadgeService } from './providers/create-badge.service';
import { FindOneBadgeService } from './providers/find-one-badge.service';
import { FindAllActiveBadgesService } from './providers/find-all-active-badges.service';
import { FindAllBadgesService } from './providers/find-all-badges.service';

const mockSeedDefaultBadgesService = { seedDefaultBadges: jest.fn() };
const mockDetermineBadgeForRankService = { determineBadgeForRank: jest.fn() };
const mockAutoAssignBadgesService = { autoAssignBadges: jest.fn() };
const mockGetBadgeByRankService = { getBadgeByRank: jest.fn() };
const mockRemoveBadgeService = { remove: jest.fn() };
const mockUpdateBadgeService = { update: jest.fn() };
const mockCreateBadgeService = { create: jest.fn() };
const mockFindOneBadgeService = { findOne: jest.fn() };
const mockFindAllActiveBadgesService = { findAllActive: jest.fn() };
const mockFindAllBadgesService = { findAll: jest.fn() };

describe('BadgeService', () => {
  let service: BadgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        {
          provide: SeedDefaultBadgesService,
          useValue: mockSeedDefaultBadgesService,
        },
        {
          provide: DetermineBadgeForRankService,
          useValue: mockDetermineBadgeForRankService,
        },
        {
          provide: AutoAssignBadgesService,
          useValue: mockAutoAssignBadgesService,
        },
        { provide: GetBadgeByRankService, useValue: mockGetBadgeByRankService },
        { provide: RemoveBadgeService, useValue: mockRemoveBadgeService },
        { provide: UpdateBadgeService, useValue: mockUpdateBadgeService },
        { provide: CreateBadgeService, useValue: mockCreateBadgeService },
        { provide: FindOneBadgeService, useValue: mockFindOneBadgeService },
        {
          provide: FindAllActiveBadgesService,
          useValue: mockFindAllActiveBadgesService,
        },
        { provide: FindAllBadgesService, useValue: mockFindAllBadgesService },
      ],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to FindAllBadgesService', async () => {
      const mockResult = [{ id: 1, title: 'Test Badge' }];
      mockFindAllBadgesService.findAll.mockResolvedValue(mockResult);
      const result = await service.findAll();
      expect(mockFindAllBadgesService.findAll).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });
  });

  describe('findAllActive', () => {
    it('should delegate to FindAllActiveBadgesService', async () => {
      const mockResult = [{ id: 1, title: 'Active Badge', isActive: true }];
      mockFindAllActiveBadgesService.findAllActive.mockResolvedValue(
        mockResult,
      );
      const result = await service.findAllActive();
      expect(mockFindAllActiveBadgesService.findAllActive).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should delegate to FindOneBadgeService', async () => {
      const mockResult = { id: 1, title: 'Test Badge' };
      mockFindOneBadgeService.findOne.mockResolvedValue(mockResult);
      const result = await service.findOne(1);
      expect(mockFindOneBadgeService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockResult);
    });
  });

  describe('create', () => {
    it('should delegate to CreateBadgeService', async () => {
      const createDto = {
        title: 'New Badge',
        rank: 1,
        description: 'Test description',
      };
      const mockResult = {
        id: 1,
        title: 'New Badge',
        rank: 1,
        description: 'Test description',
      };
      mockCreateBadgeService.create.mockResolvedValue(mockResult);
      const result = await service.create(createDto);
      expect(mockCreateBadgeService.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe(mockResult);
    });
  });

  describe('update', () => {
    it('should delegate to UpdateBadgeService', async () => {
      const updateDto = { title: 'Updated Badge' };
      const mockResult = { id: 1, title: 'Updated Badge' };
      mockUpdateBadgeService.update.mockResolvedValue(mockResult);
      const result = await service.update(1, updateDto);
      expect(mockUpdateBadgeService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe(mockResult);
    });
  });

  describe('remove', () => {
    it('should delegate to RemoveBadgeService', async () => {
      mockRemoveBadgeService.remove.mockResolvedValue(undefined);
      await service.remove(1);
      expect(mockRemoveBadgeService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('getBadgeByRank', () => {
    it('should delegate to GetBadgeByRankService', async () => {
      const mockResult = { id: 1, title: 'Rank Badge', rank: 1 };
      mockGetBadgeByRankService.getBadgeByRank.mockResolvedValue(mockResult);
      const result = await service.getBadgeByRank(1);
      expect(mockGetBadgeByRankService.getBadgeByRank).toHaveBeenCalledWith(1);
      expect(result).toBe(mockResult);
    });
  });

  describe('autoAssignBadges', () => {
    it('should delegate to AutoAssignBadgesService', async () => {
      mockAutoAssignBadgesService.autoAssignBadges.mockResolvedValue(undefined);
      await service.autoAssignBadges();
      expect(mockAutoAssignBadgesService.autoAssignBadges).toHaveBeenCalled();
    });
  });

  describe('seedDefaultBadges', () => {
    it('should delegate to SeedDefaultBadgesService', async () => {
      mockSeedDefaultBadgesService.seedDefaultBadges.mockResolvedValue(
        undefined,
      );
      await service.seedDefaultBadges();
      expect(mockSeedDefaultBadgesService.seedDefaultBadges).toHaveBeenCalled();
    });
  });
});
