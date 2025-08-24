import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;
  
    @ApiProperty({ example: 'SecurePassword123!' })
    @IsString()
    @MinLength(8)
    password: string;
  
    @ApiProperty({ example: '0xWalletAddress' })
    @IsOptional()
    @IsString()
    walletAddress?: string;
  
    @ApiProperty({ example: 'GoogleOAuthToken' })
    @IsOptional()
    @IsString()
    googleToken?: string;
  }