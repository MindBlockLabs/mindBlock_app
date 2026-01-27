import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { XpLevelService } from 'src/users/providers/xp-level.service';
import { User } from 'src/users/user.entity';

describe('XpLevelService', () => {
  let service: XpLevelService;
  let mockUserRepository;

  const mockUser = {
    id: '123',
    xp: 0,
    level: 1,
  };

  beforeEach(async () => {
    // Reset mock user for each test
    mockUser.xp = 0;
    mockUser.level = 1;

    mockUserRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpLevelService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<XpLevelService>(XpLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add XP and stay at level 1 (0 -> 100 XP)', async () => {
    mockUser.xp = 0;
    mockUser.level = 1;
    const result = await service.addXp('123', 100);
    
    expect(result.currentXp).toBe(100);
    expect(result.currentLevel).toBe(1);
    expect(result.levelUp).toBe(false);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should add XP and level up (450 -> 510 XP)', async () => {
    mockUser.xp = 450;
    mockUser.level = 1;
    const result = await service.addXp('123', 60); // Total 510 -> Level 2
    
    expect(result.currentXp).toBe(510);
    expect(result.currentLevel).toBe(2);
    expect(result.levelUp).toBe(true);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should calculate next level threshold correctly', async () => {
    mockUser.xp = 510;
    mockUser.level = 2;
    const result = await service.getUserXpLevel('123');

    // Level 2. Next level 3 starts at 2 * 500 = 1000
    expect(result.level).toBe(2);
    expect(result.xp).toBe(510);
    expect(result.nextLevel).toBe(1000);
  });
});
