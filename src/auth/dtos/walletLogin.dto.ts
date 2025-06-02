import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WalletLoginDto {
  @ApiProperty({ example: '0xWalletAddress' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ example: 'SignedMessage' })
  @IsString()
  signature: string;
}
