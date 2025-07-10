import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleProgressService } from './puzzle-progress.service';

describe('PuzzleProgressService', () => {
  let service: PuzzleProgressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PuzzleProgressService],
    }).compile();

    service = module.get<PuzzleProgressService>(PuzzleProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
