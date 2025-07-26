import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Achievement } from '../entities/achievement.entity';
import { Repository } from 'typeorm';
import { AchievementService } from './achievement.service';

const mockAchievements = [
  {
    id: '1',
    title: 'First Achievement',
    iconUrl: 'http://example.com/icon1.svg',
    unlockedAt: new Date('2024-01-01T00:00:00.000Z'),
    user: { id: 'user123' },
  },
  {
    id: '2',
    title: 'Second Achievement',
    iconUrl: 'http://example.com/icon2.svg',
    unlockedAt: new Date('2024-02-01T00:00:00.000Z'),
    user: { id: 'user123' },
  },
];

describe('AchievementsService', () => {
  let service: AchievementService;
  let repo: Repository<Achievement>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: {
            find: jest.fn().mockResolvedValue(mockAchievements),
          },
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    repo = module.get<Repository<Achievement>>(getRepositoryToken(Achievement));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return achievements for a user', async () => {
      const result = await service.findByID('user123');

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user123' } },
        relations: ['user'],
        select: ['id', 'title', 'iconUrl', 'unlockedAt'],
        order: { unlockedAt: 'DESC' },
      });

      expect(result).toEqual(mockAchievements);
    });
  });
});