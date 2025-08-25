import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PuzzleSubmission } from "../entities/puzzle-submission.entity";
import { Puzzle } from "../entities/puzzle.entity";
import { User } from "../../users/user.entity";
import { SubmitPuzzleDto } from "../dto/puzzle.dto";
import { PuzzleType } from "../enums/puzzle-type.enum";

@Injectable()
export class PuzzleProgressProvider {
constructor(
    @InjectRepository(PuzzleSubmission)
    private submissionRepo: Repository<PuzzleSubmission>,

    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

 
  async submitPuzzleAnswer(dto: SubmitPuzzleDto): Promise<PuzzleSubmission> {
    const { userId, puzzleId, solution, skipped } = dto;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const puzzle = await this.puzzleRepo.findOne({ where: { id: puzzleId } });
    if (!puzzle) throw new NotFoundException('Puzzle not found');

    const existing = await this.submissionRepo.findOne({
      where: { user: { id: userId }, puzzle: { id: puzzleId } },
    });

    if (existing) {
      throw new BadRequestException('Puzzle already submitted');
    }

    const isCorrect = !skipped && solution === puzzle.solution;

    const submission = this.submissionRepo.create({
      user,
      puzzle,
      solution,
      skipped,
      isCorrect,
    });

    return await this.submissionRepo.save(submission);
  }

  /**
   * Get user's puzzle progress by category
   */
  async getProgressByCategory(userId: string): Promise<
    Record<PuzzleType, { completed: number; total: number }>
  > {
    const allPuzzles = await this.puzzleRepo.find({
      where: { isPublished: true },
    });

    const completed = await this.submissionRepo.find({
      where: { user: { id: userId }, isCorrect: true },
      relations: ['puzzle'],
    });

    const progressMap: Record<string, { completed: number; total: number }> = {};

    for (const puzzle of allPuzzles) {
      const key = puzzle.type;
      progressMap[key] = progressMap[key] || { completed: 0, total: 0 };
      progressMap[key].total += 1;
    }

    for (const submission of completed) {
      const key = submission.puzzle.type;
      if (progressMap[key]) {
        progressMap[key].completed += 1;
      }
    }

    return progressMap;
  }}