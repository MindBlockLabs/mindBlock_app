import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './createUserDto';

export class EditUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) { }
