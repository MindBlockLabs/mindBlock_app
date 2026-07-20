import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { XpLevelService } from './xp-level.service';
import { User } from '../user.entity';

describe('XpLevelService', () => {
  let service: XpLevelService;
  let userRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpLevelService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<XpLevelService>(XpLevelService);
  });

  it('emits xp_awarded with the expected payload shape', async () => {
    const user = { id: 'user-1', xp: 0, level: 1 } as User;
    userRepository.findOne!.mockResolvedValue(user);
    userRepository.save!.mockResolvedValue({ ...user, xp: 100, level: 1 });

    const result = await service.addXp('user-1', 100);

    expect(result).toEqual({
      levelUp: false,
      currentLevel: 1,
      currentXp: 100,
      previousLevel: 1,
    });

    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'xp_awarded',
      expect.objectContaining({
        userId: 'user-1',
        entityId: 'user-1',
        xpAmount: 100,
        currentLevel: 1,
        previousLevel: 1,
      }),
    );
  });

  it('emits user_leveled_up when the user levels up', async () => {
    const user = { id: 'user-2', xp: 450, level: 1 } as User;
    userRepository.findOne!.mockResolvedValue(user);
    userRepository.save!.mockResolvedValue({ ...user, xp: 550, level: 2 });

    const result = await service.addXp('user-2', 100);

    expect(result.levelUp).toBe(true);
    expect(result.currentLevel).toBe(2);
    expect(result.previousLevel).toBe(1);

    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'user_leveled_up',
      expect.objectContaining({
        userId: 'user-2',
        entityId: 'user-2',
        previousLevel: 1,
        currentLevel: 2,
      }),
    );
  });
});
