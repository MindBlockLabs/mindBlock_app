import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Achievement } from '../entities/achievement.entity';
import { Repository } from 'typeorm';
import { FindByUserIdProvider } from './find-by-user-id-provider';

const mockAchievements = [
  {
    id: '1',
    title: 'First Achievement',
    iconUrl: 'http://example.com/icon1.svg',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    user: { id: 'user123' },
  },
  {
    id: '2',
    title: 'Second Achievement',
    iconUrl: 'http://example.com/icon2.svg',
    createdAt: new Date('2024-02-01T00:00:00.000Z'),
    user: { id: 'user123' },
  },
];

describe('FindByUserIdProvider', () => {
  let provider: FindByUserIdProvider;
  let repo: Repository<Achievement>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByUserIdProvider,
        {
          provide: getRepositoryToken(Achievement),
          useValue: {
            find: jest.fn().mockResolvedValue(mockAchievements),
          },
        },
      ],
    }).compile();

    provider = module.get<FindByUserIdProvider>(FindByUserIdProvider);
    repo = module.get<Repository<Achievement>>(getRepositoryToken(Achievement));
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return a list of achievements for the given user ID', async () => {
      const result = await provider.findByUserId('user123');

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user123' } },
        relations: ['user'],
        select: ['id', 'title', 'iconUrl', 'createdAt'],
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual(mockAchievements);
    });
  });
});