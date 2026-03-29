import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePuzzleProvider } from './create-puzzle.provider';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetAllPuzzlesProvider } from './getAll-puzzle.provider';
import { PuzzleResponseDto } from '../dtos/puzzle-response.dto';

@Injectable()
export class PuzzlesService {
  constructor(
    private readonly createPuzzleProvider: CreatePuzzleProvider,

    private readonly AllPuzzlesProvider: GetAllPuzzlesProvider,

    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,
  ) {}

  public async create(createPuzzleDto: CreatePuzzleDto): Promise<PuzzleResponseDto> {
    const puzzle = await this.createPuzzleProvider.execute(createPuzzleDto);
    return this.mapToResponse(puzzle);
  }

  // -------------------------------
  // GET /puzzles/:id
  // -------------------------------
  async getPuzzleById(id: string): Promise<PuzzleResponseDto> {
    const puzzle = await this.puzzleRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!puzzle) {
      throw new NotFoundException('Puzzle not found');
    }

    return this.mapToResponse(puzzle);
  }

  // -------------------------------
  // GET /puzzles/daily-quest
  // -------------------------------
  async getDailyQuestPuzzles(): Promise<PuzzleResponseDto[]> {
    const puzzles = await this.puzzleRepo.find({
      where: {
        category: {
          isActive: true,
        },
      },
      relations: ['category'],
    });

    // Fisher-Yates shuffle for randomized order similar to ORDER BY RANDOM()
    for (let i = puzzles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [puzzles[i], puzzles[j]] = [puzzles[j], puzzles[i]];
    }

    return puzzles.slice(0, 5).map(p => this.mapToResponse(p));
  }

  public async findAll(query: PuzzleQueryDto) {
    const result = await this.AllPuzzlesProvider.findAll(query);
    return {
      ...result,
      data: result.data.map(p => this.mapToResponse(p)),
    };
  }

  private mapToResponse(puzzle: Puzzle): PuzzleResponseDto {
    const { correctAnswer, ...response } = puzzle;
    return response as PuzzleResponseDto;
  }
}
