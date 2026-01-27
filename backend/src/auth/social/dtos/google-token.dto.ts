import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

/**google token dto class */
export class GoogleTokenDto {
  /**token of type string */
  @ApiProperty({
    type: 'string',
    example: 'hfsde2345bvvv',
    description: 'An auto generated strings when you log in with you google id',
  })
  @IsNotEmpty()
  token: string;
}
