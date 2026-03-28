import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc as SorobanRpc,
  xdr,
} from 'stellar-sdk';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

const RETRY_QUEUE_KEY = 'blockchain:submit_puzzle:retry';

@Injectable()
export class SubmitPuzzleProvider {
  private readonly logger = new Logger(SubmitPuzzleProvider.name);
  private readonly rpcUrl: string;
  private readonly contractId: string;
  private readonly oracleSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.rpcUrl = this.configService.getOrThrow<string>('SOROBAN_RPC_URL');
    this.contractId = this.configService.getOrThrow<string>(
      'SOROBAN_CONTRACT_ID',
    );
    this.oracleSecret = this.configService.getOrThrow<string>(
      'ORACLE_WALLET_SECRET',
    );
  }

  async submitPuzzleOnChain(
    stellarWallet: string,
    puzzleId: string,
    category: string,
    score: number,
  ): Promise<void> {
    try {
      await this.invokeSubmitPuzzle(stellarWallet, puzzleId, category, score);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `submit_puzzle on-chain failed — wallet: ${stellarWallet}, puzzleId: ${puzzleId}, score: ${score}. Error: ${errorMessage}`,
      );
      await this.enqueueRetry(stellarWallet, puzzleId, category, score);
    }
  }

  private async invokeSubmitPuzzle(
    stellarWallet: string,
    puzzleId: string,
    category: string,
    score: number,
  ): Promise<void> {
    const server = new SorobanRpc.Server(this.rpcUrl);
    const oracleKeypair = Keypair.fromSecret(this.oracleSecret);
    const oracleAccount = await server.getAccount(oracleKeypair.publicKey());

    const contract = new Contract(this.contractId);

    const args: xdr.ScVal[] = [
      nativeToScVal(stellarWallet, { type: 'address' }),
      nativeToScVal(puzzleId, { type: 'string' }),
      nativeToScVal(category, { type: 'string' }),
      nativeToScVal(score, { type: 'i64' }),
    ];

    const tx = new TransactionBuilder(oracleAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call('submit_puzzle', ...args))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(oracleKeypair);

    const sendResult = await server.sendTransaction(preparedTx);

    if (sendResult.status === 'ERROR') {
      throw new Error(
        `Transaction send failed: ${JSON.stringify(sendResult.errorResult)}`,
      );
    }

    // Poll for final status
    const txHash = sendResult.hash;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const statusResult = await server.getTransaction(txHash);

      if (statusResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        this.logger.log(
          `submit_puzzle on-chain succeeded — wallet: ${stellarWallet}, puzzleId: ${puzzleId}, txHash: ${txHash}`,
        );
        return;
      }

      if (statusResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed on-chain: ${txHash}`);
      }

      attempts++;
    }

    throw new Error(`Transaction timed out waiting for confirmation: ${txHash}`);
  }

  private async enqueueRetry(
    stellarWallet: string,
    puzzleId: string,
    category: string,
    score: number,
  ): Promise<void> {
    try {
      const payload = JSON.stringify({ stellarWallet, puzzleId, category, score });
      await this.redis.rpush(RETRY_QUEUE_KEY, payload);
      this.logger.warn(
        `submit_puzzle queued for retry — wallet: ${stellarWallet}, puzzleId: ${puzzleId}`,
      );
    } catch (redisErr) {
      const msg = redisErr instanceof Error ? redisErr.message : String(redisErr);
      this.logger.error(`Failed to enqueue retry: ${msg}`);
    }
  }
}
