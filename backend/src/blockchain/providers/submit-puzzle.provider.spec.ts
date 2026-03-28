import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SubmitPuzzleProvider } from './submit-puzzle.provider';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import * as StellarSdk from 'stellar-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_SECRET = 'SDBX2ONEFXWE3FOPJM7OIWQVLA6436CJTQURXLFHCRLBJAS4SZ3SBA5Z';
const FAKE_PUBLIC = 'GCIF7RP3SYHJW5IRCXAM66AKH3XL7ZFL6VI3TQTXVQXVAL6QLT5FBWAY';

const mockAccount = new StellarSdk.Account(FAKE_PUBLIC, '100');

const mockSendResult = { status: 'PENDING', hash: 'deadbeef' };
const mockGetTransactionSuccess = {
  status: StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS,
};

const mockSimResult = {
  transactionData: new StellarSdk.SorobanDataBuilder().build(),
  minResourceFee: '100',
  cost: { cpuInsns: '0', memBytes: '0' },
  footprint: '',
  results: [],
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRpcServer = {
  getAccount: jest.fn().mockResolvedValue(mockAccount),
  simulateTransaction: jest.fn().mockResolvedValue(mockSimResult),
  sendTransaction: jest.fn().mockResolvedValue(mockSendResult),
  getTransaction: jest.fn().mockResolvedValue(mockGetTransactionSuccess),
};

jest.mock('stellar-sdk', () => {
  const actual = jest.requireActual<typeof StellarSdk>('stellar-sdk');
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: jest.fn().mockImplementation(() => mockRpcServer),
      assembleTransaction: jest
        .fn()
        .mockImplementation((tx: StellarSdk.Transaction) => ({
          build: () => tx,
        })),
      Api: {
        ...actual.rpc.Api,
        isSimulationError: jest.fn().mockReturnValue(false),
        GetTransactionStatus: actual.rpc.Api.GetTransactionStatus,
      },
    },
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubmitPuzzleProvider', () => {
  let provider: SubmitPuzzleProvider;
  const mockRedis = { rpush: jest.fn().mockResolvedValue(1) };

  const configValues: Record<string, string> = {
    SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
    SOROBAN_CONTRACT_ID: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    ORACLE_WALLET_SECRET: FAKE_SECRET,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset polling mock to succeed immediately on first poll
    mockRpcServer.getTransaction.mockResolvedValue(mockGetTransactionSuccess);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitPuzzleProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key in configValues) return configValues[key];
              throw new Error(`Missing config: ${key}`);
            }),
          },
        },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    // Silence logger noise in test output
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    provider = module.get<SubmitPuzzleProvider>(SubmitPuzzleProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('submitPuzzleOnChain — success path', () => {
    it('builds and submits a signed transaction for a correct puzzle completion', async () => {
      await provider.submitPuzzleOnChain(
        FAKE_PUBLIC,
        'puzzle-uuid-001',
        'category-uuid-001',
        150,
      );

      // RPC server was instantiated with the configured URL
      expect(StellarSdk.rpc.Server).toHaveBeenCalledWith(
        'https://soroban-testnet.stellar.org',
      );

      // Oracle account was fetched
      expect(mockRpcServer.getAccount).toHaveBeenCalledWith(FAKE_PUBLIC);

      // Transaction was simulated
      expect(mockRpcServer.simulateTransaction).toHaveBeenCalledTimes(1);

      // Transaction was sent
      expect(mockRpcServer.sendTransaction).toHaveBeenCalledTimes(1);

      // Final status was polled
      expect(mockRpcServer.getTransaction).toHaveBeenCalledWith('deadbeef');

      // No retry was enqueued for a successful submission
      expect(mockRedis.rpush).not.toHaveBeenCalled();
    });
  });

  describe('submitPuzzleOnChain — failure path', () => {
    it('enqueues a retry and does not throw when the RPC call errors', async () => {
      mockRpcServer.sendTransaction.mockRejectedValueOnce(
        new Error('Network timeout'),
      );

      // Must not throw — failure is non-blocking
      await expect(
        provider.submitPuzzleOnChain(
          FAKE_PUBLIC,
          'puzzle-uuid-002',
          'category-uuid-002',
          80,
        ),
      ).resolves.toBeUndefined();

      // Failure logged and pushed to Redis retry queue
      expect(mockRedis.rpush).toHaveBeenCalledWith(
        'blockchain:submit_puzzle:retry',
        expect.stringContaining('puzzle-uuid-002'),
      );
    });

    it('enqueues a retry when simulation returns an error', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (StellarSdk.rpc.Api.isSimulationError as unknown as jest.Mock).mockReturnValueOnce(true);
      (mockRpcServer.simulateTransaction as jest.Mock).mockResolvedValueOnce({
        error: 'HostError: ...',
      });

      await expect(
        provider.submitPuzzleOnChain(
          FAKE_PUBLIC,
          'puzzle-uuid-003',
          'category-uuid-003',
          60,
        ),
      ).resolves.toBeUndefined();

      expect(mockRedis.rpush).toHaveBeenCalledTimes(1);
    });
  });
});
