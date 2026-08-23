import { registerAs } from '@nestjs/config';

/**
 * Stellar/Soroban on-chain configuration.
 *
 * Loaded through `ConfigModule.forFeature(stellarConfig)` inside
 * BlockchainModule so every blockchain provider can resolve these values
 * via `ConfigService.get('stellar')` without reaching for `process.env`.
 */
export default registerAs('stellar', () => ({
  secretKey: process.env.STELLAR_SECRET_KEY,
  contractId: process.env.STELLAR_CONTRACT_ID,
  rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    'Test SDF Network ; September 2015',
}));
