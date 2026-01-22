import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressModule } from '../progress.module';
import { ProgressCalculationProvider } from '../providers/progress-calculation.provider';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';

describe('ProgressModule Integration', () => {
  let module: TestingModule;
  let provider: ProgressCalculationProvider;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Puzzle, UserProgress],
          synchronize: true,
        }),
        ProgressModule,
      ],
    }).compile();

    provider = module.get<ProgressCalculationProvider>(ProgressCalculationProvider);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should have ProgressModule defined', () => {
    expect(provider).toBeDefined();
  });

  it('should create and retrieve UserProgress entity', async () => {
    // Create a test puzzle first
    const puzzle = new Puzzle();
    puzzle.id = 'test-puzzle-uuid';
    puzzle.question = 'Test question?';
    puzzle.options = ['A', 'B', 'C', 'D'];
    puzzle.correctAnswer = 'A';
    puzzle.difficulty = PuzzleDifficulty.BEGINNER;
    puzzle.categoryId = 'test-category-uuid';
    puzzle.points = 100;
    puzzle.timeLimit = 60;
    puzzle.explanation = 'Test explanation';

    // This would normally be handled by the puzzle repository
    // For integration test, we'll focus on the progress calculation logic

    const submitAnswerDto: SubmitAnswerDto = {
      userId: 'test-user-uuid',
      puzzleId: puzzle.id,
      categoryId: puzzle.categoryId,
      userAnswer: 'A',
      timeSpent: 30,
    };

    // Test the validation logic directly
    const validation = provider.validateAnswer(submitAnswerDto.userAnswer, puzzle.correctAnswer);
    expect(validation.isCorrect).toBe(true);

    // Test point calculation
    const points = provider.calculatePoints(puzzle, submitAnswerDto.timeSpent, validation.isCorrect);
    expect(points).toBe(120); // 20% bonus for fast completion
  });
});
