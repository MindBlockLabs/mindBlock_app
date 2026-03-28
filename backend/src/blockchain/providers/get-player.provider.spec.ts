import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GetPlayerProvider } from './get-player.provider';
import * as StellarSdk from 'stellar-sdk';

// Mock StellarSdk
jest.mock('stellar-sdk', () => {
  return {
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        simulateTransaction: jest.fn(),
      })),
      Api: {
        isSimulationSuccess: jest.fn() as unknown as jest.Mock,
      },
    },
    Contract: jest.fn().mockImplementation(() => ({
      call: jest.fn().mockReturnValue({}),
    })),
    Address: {
      fromString: jest.fn().mockReturnValue({}),
    },
    Account: jest.fn(),
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
    xdr: {
      ScValType: {
        scvVoid: jest.fn().mockImplementation(() => ({
          value: 0,
          switch: () => 0,
        })),
      },
    },
  };
});

describe('GetPlayerProvider', () => {
  let provider: GetPlayerProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPlayerProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SOROBAN_CONTRACT_ID') return 'CA1234567890';
              if (key === 'SOROBAN_RPC_URL') return 'https://soroban-testnet.stellar.org';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GetPlayerProvider>(GetPlayerProvider);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('getPlayerOnChain', () => {
    const mockWallet = 'GABC...';

    it('should return player data when simulation is successful and player exists', async () => {
      const mockPlayerData = {
        address: mockWallet,
        username: 'testuser',
        xp: 100,
      };

      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      (StellarSdk.scValToNative as jest.Mock).mockReturnValue(mockPlayerData);
      
      const server = (provider as any).server;
      server.simulateTransaction.mockResolvedValue({
        result: {
          retval: {
            switch: jest.fn().mockReturnValue(1), // Not void
          },
        },
      });

      const result = await provider.getPlayerOnChain(mockWallet);
      
      expect(result).toEqual(mockPlayerData);
      expect(server.simulateTransaction).toHaveBeenCalled();
    });

    it('should return null when player is not found (void response)', async () => {
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(true);
      (StellarSdk.xdr.ScValType.scvVoid as jest.Mock).mockReturnValue({ value: 0 });
      
      const server = (provider as any).server;
      server.simulateTransaction.mockResolvedValue({
        result: {
          retval: {
            switch: jest.fn().mockReturnValue({ value: 0 }), // Void
          },
        },
      });

      const result = await provider.getPlayerOnChain(mockWallet);
      
      expect(result).toBeNull();
    });

    it('should return null when simulation fails', async () => {
      (StellarSdk.rpc.Api.isSimulationSuccess as unknown as jest.Mock).mockReturnValue(false);
      
      const result = await provider.getPlayerOnChain(mockWallet);
      
      expect(result).toBeNull();
    });

    it('should return null and log error when RPC call throws', async () => {
      const server = (provider as any).server;
      server.simulateTransaction.mockRejectedValue(new Error('Network error'));
      
      const result = await provider.getPlayerOnChain(mockWallet);
      
      expect(result).toBeNull();
    });

    it('should return null if contractId is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      
      // Need to re-instantiate or bypass constructor for this test if contractId is set once
      // but the current implementation sets it in constructor. 
      // Let's just mock the instance property for the test.
      (provider as any).contractId = null;

      const result = await provider.getPlayerOnChain(mockWallet);
      expect(result).toBeNull();
    });
  });
});
