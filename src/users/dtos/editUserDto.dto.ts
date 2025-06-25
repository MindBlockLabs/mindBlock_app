import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';

export class EditUserDto {
  @ApiProperty({
    description: "username of the user",
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({
    description: "Email address of the user",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: "Password of the user",
    required: false,
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
