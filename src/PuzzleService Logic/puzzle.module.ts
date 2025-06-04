// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { PuzzleService } from './puzzle.service';
// import { PuzzleController } from './puzzle.controller';
// import {
//   Puzzle,
//   PuzzleSubmission,
//   PuzzleProgress,
//   User,
// } from './entities';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([
//       Puzzle,
//       PuzzleSubmission,
//       PuzzleProgress,
//       User,
//     ]),
//   ],
//   controllers: [PuzzleController],
//   providers: [PuzzleService],
//   exports: [PuzzleService],
// })
// export class PuzzleModule {}