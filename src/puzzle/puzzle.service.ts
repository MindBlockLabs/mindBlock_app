// src/puzzle/puzzle.service.ts
import { Injectable } from '@nestjs/common';
import { PuzzleType } from './enums/puzzle-type.enum';

@Injectable()
export class PuzzleService {
  getPuzzleStub() {
    return {
      message: 'Puzzle module is working',
      typesAvailable: Object.values(PuzzleType),
    };
  }
}