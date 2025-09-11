import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, Matches } from 'class-validator';

export class WalletLoginDto {
  @ApiProperty({
    example: '0x1234567890abcdef1234567890abcdef12345678',
    description: 'Starknet wallet address',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{1,64}$/, {
    message: 'Invalid Starknet wallet address format',
  })
  walletAddress: string;

  @ApiProperty({ 
    example: ['0x123abc...', '0x456def...'],
    description: 'Starknet signature array [r, s]',
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  signature: [string, string];

  @ApiProperty({ 
    example: 'nonce_1693123456789_abc123_456789',
    description: 'Server-generated nonce for this authentication attempt'
  })
  @IsString()
  nonce: string;

   @ApiProperty({ 
    example: '0x789def1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    description: 'Public key associated with the wallet'
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, { 
    message: 'Invalid public key format - must be 64 hex characters with 0x prefix' 
  })
  publicKey: string;
}
