import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePuzzleProvider } from './create-puzzle.provider';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { GetAllPuzzlesProvider } from './getAll-puzzle.provider';

@Injectable()
export class PuzzlesService {
  constructor(
    private readonly createPuzzleProvider: CreatePuzzleProvider,

    private readonly AllPuzzlesProvider: GetAllPuzzlesProvider,

    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,
  ) {}

  public async create(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.createPuzzleProvider.execute(createPuzzleDto);
  }

  // -------------------------------
  // GET /puzzles/:id
  // -------------------------------
  async getPuzzleById(id: string): Promise<Puzzle> {
    const puzzle = await this.puzzleRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!puzzle) {
      throw new NotFoundException('Puzzle not found');
    }

    return puzzle;
  }

  // -------------------------------
  // GET /puzzles/daily-quest
  // -------------------------------
  async getDailyQuestPuzzles(): Promise<Puzzle[]> {
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

    return puzzles.slice(0, 5);
  }

  public async findAll(query: PuzzleQueryDto) {
    return this.AllPuzzlesProvider.findAll(query);
  }
}
