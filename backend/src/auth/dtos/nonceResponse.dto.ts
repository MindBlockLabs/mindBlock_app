import { ApiProperty } from "@nestjs/swagger";

export class NonceResponseDto {
  @ApiProperty({ 
    example: 'nonce_1693123456789_abc123_456789',
    description: 'Unique nonce to be signed by the wallet' 
  })
  nonce: string;

  @ApiProperty({ 
    example: 1693123456789,
    description: 'Unix timestamp when the nonce expires' 
  })
  expiresAt: number;
}