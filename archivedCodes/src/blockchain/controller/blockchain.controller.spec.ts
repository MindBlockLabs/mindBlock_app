import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from '../provider/blockchain.service';

describe('BlockchainController', () => {
  let controller: BlockchainController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        {
          provide: BlockchainService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
