import { PartialType } from '@nestjs/swagger';
import { CreatePuzzleProgressDto } from './create-puzzle-progress.dto';

export class UpdatePuzzleProgressDto extends PartialType(CreatePuzzleProgressDto) {}
