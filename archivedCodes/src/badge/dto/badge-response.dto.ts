import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class BadgeResponseDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  description: string

  @ApiPropertyOptional()
  iconUrl?: string

  @ApiProperty()
  rank: number

  @ApiProperty()
  isActive: boolean

  @ApiProperty()
  isAutoAssigned: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
