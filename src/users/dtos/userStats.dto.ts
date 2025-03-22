import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class UserStatsDto {
    @ApiProperty({ example: 1500 })
    @IsInt()
    rating: number;
  
    @ApiProperty({ example: 50 })
    @IsInt()
    challengesCompleted: number;
  
    @ApiProperty({ example: 10 })
    @IsInt()
    tokensEarned: number;
  }