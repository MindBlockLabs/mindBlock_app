import { Test, TestingModule } from '@nestjs/testing';
import { BadgeService } from './badge.service';
import { Badge } from './entities/badge.entity';
import { LeaderboardEntry } from 'src/leaderboard/entities/leaderboard.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BadgeService', () => {
  let service: BadgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        {
          provide: getRepositoryToken(Badge),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LeaderboardEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
