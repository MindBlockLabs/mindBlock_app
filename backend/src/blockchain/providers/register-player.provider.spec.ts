import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RegisterPlayerProvider } from './register-player.provider';
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
        publicKey: jest.fn().mockReturnValue('GADMIN...'),
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

describe('RegisterPlayerProvider', () => {
  let provider: RegisterPlayerProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterPlayerProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SOROBAN_CONTRACT_ID') return 'CA1234567890';
              if (key === 'SOROBAN_RPC_URL') return 'https://soroban-testnet.stellar.org';
              if (key === 'SOROBAN_ADMIN_SECRET') return 'SADMINSECRET';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<RegisterPlayerProvider>(RegisterPlayerProvider);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('registerPlayerOnChain', () => {
    const mockWallet = 'GABC...';
    const mockUsername = 'testuser';
    const mockIqLevel = 100;

    it('should successfully register a player', async () => {
      const server = (provider as any).server;
      
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      
      const mockAssembledTx = { sign: jest.fn() };
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue(mockAssembledTx);
      
      server.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'TXHASH' });
      server.getTransaction.mockResolvedValue({ status: 'SUCCESS' });

      const result = await provider.registerPlayerOnChain(mockWallet, mockUsername, mockIqLevel);
      
      expect(result.status).toBe('SUCCESS');
      expect(server.getAccount).toHaveBeenCalled();
      expect(server.simulateTransaction).toHaveBeenCalled();
      expect(server.sendTransaction).toHaveBeenCalled();
      expect(mockAssembledTx.sign).toHaveBeenCalled();
    });

    it('should throw error if SOROBAN_CONTRACT_ID is missing', async () => {
      (provider as any).contractId = null;
      await expect(provider.registerPlayerOnChain(mockWallet, mockUsername, mockIqLevel))
        .rejects.toThrow('SOROBAN_CONTRACT_ID is not defined');
    });

    it('should throw error if SOROBAN_ADMIN_SECRET is missing', async () => {
      (provider as any).adminSecret = null;
      await expect(provider.registerPlayerOnChain(mockWallet, mockUsername, mockIqLevel))
        .rejects.toThrow('SOROBAN_ADMIN_SECRET is not defined');
    });

    it('should throw error if simulation fails', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({ error: 'Simulation failed' });
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(false);

      await expect(provider.registerPlayerOnChain(mockWallet, mockUsername, mockIqLevel))
        .rejects.toThrow('Simulation failed: Simulation failed');
    });

    it('should throw error if transaction submission fails', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue({ sign: jest.fn() });
      server.sendTransaction.mockResolvedValue({ status: 'ERROR' });

      await expect(provider.registerPlayerOnChain(mockWallet, mockUsername, mockIqLevel))
        .rejects.toThrow('Transaction submission failed');
    });

    it('should throw error if transaction fails after submission', async () => {
      const server = (provider as any).server;
      server.getAccount.mockResolvedValue({});
      server.simulateTransaction.mockResolvedValue({});
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      (StellarSdk.rpc.assembleTransaction as jest.Mock).mockReturnValue({ sign: jest.fn() });
      server.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'TXHASH' });
      server.getTransaction.mockResolvedValue({ status: 'FAILED' });

      await expect(provider.registerPlayerOnChain(mockWallet, mockUsername, mockIqLevel))
        .rejects.toThrow('Transaction failed after submission');
    });
  });
});
