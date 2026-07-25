import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('linkWallet', () => {
    it('emits wallet_linked event with expected payload on success', async () => {
      const userId = 'user-1';
      const walletAddress = 'GABC1234567890';

      const result = await service.linkWallet(userId, walletAddress);

      expect(result).toEqual({ success: true, walletAddress });

      // Wait for setImmediate queue to flush
      await new Promise((resolve) => setImmediate(resolve));

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'wallet_linked',
        expect.objectContaining({
          userId,
          walletAddress,
          entityId: walletAddress,
          timestamp: expect.any(Date),
        }),
      );
    });

    it('emits wallet_link_failed event with expected payload on invalid address', async () => {
      const userId = 'user-2';
      const invalidWalletAddress = '';

      await expect(
        service.linkWallet(userId, invalidWalletAddress),
      ).rejects.toThrow(BadRequestException);

      // Wait for setImmediate queue to flush
      await new Promise((resolve) => setImmediate(resolve));

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'wallet_link_failed',
        expect.objectContaining({
          userId,
          walletAddress: '',
          reason: 'Invalid or missing wallet address',
          entityId: userId,
          timestamp: expect.any(Date),
        }),
      );
    });

    it('fire-and-forget: swallows errors thrown by eventEmitter without crashing linkWallet', async () => {
      eventEmitter.emit.mockImplementation(() => {
        throw new Error('EventEmitter listener crash');
      });

      const result = await service.linkWallet('user-3', 'G123456');
      expect(result.success).toBe(true);

      // Wait for setImmediate queue to flush
      await expect(
        new Promise((resolve) => setImmediate(resolve)),
      ).resolves.not.toThrow();
    });
  });
});
