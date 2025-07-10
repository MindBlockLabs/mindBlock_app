import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleProgressController } from './puzzle-progress.controller';
import { PuzzleProgressService } from './puzzle-progress.service';

describe('PuzzleProgressController', () => {
  let controller: PuzzleProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuzzleProgressController],
      providers: [PuzzleProgressService],
    }).compile();

    controller = module.get<PuzzleProgressController>(PuzzleProgressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
