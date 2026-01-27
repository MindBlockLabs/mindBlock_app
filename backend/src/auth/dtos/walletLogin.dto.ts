import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class StellarWalletLoginDto {
  @ApiProperty({
    example: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
    description: 'Stellar wallet address (public key)',
  })
  @IsString()
  @Matches(/^[GM][A-Z2-7]{55}$/, {
    message: 'Invalid Stellar wallet address format',
  })
  walletAddress: string;

  @ApiProperty({
    example: 'base64SignatureString==',
    description: 'Base64 encoded ed25519 signature',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    example: 'stellar_nonce_1693123456789_abc123_BTODB4A',
    description: 'Server-generated nonce for this authentication attempt',
  })
  @IsString()
  nonce: string;

  @ApiProperty({
    example: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
    description:
      'Stellar public key (same as wallet address for account-based wallets)',
  })
  @IsString()
  @Matches(/^[GM][A-Z2-7]{55}$/, {
    message: 'Invalid Stellar public key format',
  })
  publicKey: string;
}
