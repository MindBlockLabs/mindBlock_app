import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class LeaderboardEntryDto {
    @ApiProperty({ example: 'johndoe' })
    @IsString()
    username: string;
  
    @ApiProperty({ example: 1000 })
    @IsInt()
    score: number;
  
    @ApiProperty({ example: 5 })
    @IsInt()
    rank: number;
  }