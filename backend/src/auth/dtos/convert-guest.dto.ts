import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength } from 'class-validator';

export class ConvertGuestDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestSessionId: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Account password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Stellar wallet address' })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}
