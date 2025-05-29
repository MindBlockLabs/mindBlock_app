import { Type } from "class-transformer"
import { IsOptional, IsPositive } from "class-validator"

export class paginationQueryDto {
    @IsOptional()
    @IsPositive()
    // @Type(() => Number)
    limit: number = 10

    @IsOptional()
    @IsPositive()
    // @Type(() => Number)
    page: number = 1
}