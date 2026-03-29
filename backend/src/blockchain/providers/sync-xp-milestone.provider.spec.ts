import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SyncXpMilestoneProvider } from './sync-xp-milestone.provider';
import * as StellarSdk from 'stellar-sdk';

// Mock StellarSdk
jest.mock('stellar-sdk', () => {
  return {
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        getAccount: jest.fn(),
        simulateTransaction: jest.fn(),
        sendTransaction: jest.fn(),
        getTransaction: jest.fn(),
      })),
      Api: {
        isSimulationSuccess: jest.fn() as unknown as jest.Mock,
      },
      assembleTransaction: jest.fn(),
    },
    Contract: jest.fn().mockImplementation(() => ({
      call: jest.fn().mockReturnValue({}),
    })),
    Address: {
      fromString: jest.fn().mockReturnValue({}),
    },
    Keypair: {
      fromSecret: jest.fn().mockImplementation(() => ({
        publicKey: jest.fn().mockReturnValue('GORACLE...'),
        sign: jest.fn(),
      })),
    },
    TransactionBuilder: jest.fn().mockImplementation(() => ({
      addOperation: jest.fn().mockReturnThis(),
      setTimeout: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    })),
    Networks: {
      TESTNET: 'testnet',
    },
    TimeoutInfinite: 0,
    nativeToScVal: jest.fn(),
    scValToNative: jest.fn(),
  };
});

describe('SyncXpMilestoneProvider', () => {
  let provider: SyncXpMilestoneProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncXpMilestoneProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SOROBAN_CONTRACT_ID') return 'CA1234567890';
              if (key === 'SOROBAN_RPC_URL') return 'https://soroban-testnet.stellar.org';
              if (key === 'SOROBAN_ADMIN_SECRET') return 'SORACLESECRET';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<SyncXpMilestoneProvider>(SyncXpMilestoneProvider);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('syncXpMilestone', () => {
    const mockWallet = 'GABC123...';
    const mockNewLevel = 5;
    const mockTotalXp = 2500;

    it('should successfully sync XP milestone on level-up', async () => {
      const server = (provider as any).server;

      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);

      const mockAssembledTx = { sign: jest.fn() };
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue(mockAssembledTx);

      server.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'TXHASH123' });
      server.getTransaction.mockResolvedValue({ status: 'SUCCESS' });

      // Should not throw
      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();

      expect(server.getAccount).toHaveBeenCalled();
      expect(server.simulateTransaction).toHaveBeenCalled();
      expect(server.sendTransaction).toHaveBeenCalled();
      expect(mockAssembledTx.sign).toHaveBeenCalled();
    });

    it('should not throw when contract ID is missing', async () => {
      (provider as any).contractId = null;

      // Should silently return without throwing
      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();

      // No blockchain calls should be made
      const server = (provider as any).server;
      expect(server.getAccount).not.toHaveBeenCalled();
    });

    it('should not throw when oracle secret is missing', async () => {
      (provider as any).oracleSecret = null;

      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();

      const server = (provider as any).server;
      expect(server.getAccount).not.toHaveBeenCalled();
    });

    it('should not throw when stellar wallet is empty', async () => {
      await expect(
        provider.syncXpMilestone('', mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();

      const server = (provider as any).server;
      expect(server.getAccount).not.toHaveBeenCalled();
    });

    it('should not throw when simulation fails', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({ error: 'Simulation failed' });
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(false);

      // Should not throw - failures are logged and swallowed
      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();
    });

    it('should not throw when transaction submission fails', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue({ sign: jest.fn() });
      server.sendTransaction.mockResolvedValue({ status: 'ERROR' });

      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();
    });

    it('should not throw when transaction fails after submission', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue({ sign: jest.fn() });
      server.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'TXHASH' });
      server.getTransaction.mockResolvedValue({ status: 'FAILED' });

      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();
    });

    it('should not throw when an unexpected error occurs', async () => {
      const server = (provider as any).server;
      server.getAccount.mockRejectedValue(new Error('Network error'));

      // Should catch error and not rethrow
      await expect(
        provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp),
      ).resolves.toBeUndefined();
    });

    it('should handle assembled transaction with build method', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);

      // Return a TransactionBuilder-like object (has build, not sign)
      const mockBuiltTx = { sign: jest.fn() };
      const mockAssembledTxBuilder = {
        build: jest.fn().mockReturnValue(mockBuiltTx),
      };
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue(mockAssembledTxBuilder);

      server.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'TXHASH' });
      server.getTransaction.mockResolvedValue({ status: 'SUCCESS' });

      await provider.syncXpMilestone(mockWallet, mockNewLevel, mockTotalXp);

      expect(mockAssembledTxBuilder.build).toHaveBeenCalled();
      expect(mockBuiltTx.sign).toHaveBeenCalled();
    });
  });
});
