import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateUserProfileDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsOptional()
    name?: string;
  
    @ApiProperty({ example: 'johndoe' })
    @IsString()
    @IsOptional()
    username?: string;
  
    @ApiProperty({ example: 'avatar_url.jpg' })
    @IsString()
    @IsOptional()
    avatar?: string;
  }