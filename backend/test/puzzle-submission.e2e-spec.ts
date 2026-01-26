import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../src/puzzles/entities/puzzle.entity';
import { User } from '../src/users/user.entity';
import { UserProgress } from '../src/progress/entities/user-progress.entity';
import { PuzzleDifficulty } from '../src/puzzles/enums/puzzle-difficulty.enum';

describe('Puzzle Submission (e2e)', () => {
  let app: INestApplication;
  let puzzleRepo: Repository<Puzzle>;
  let userRepo: Repository<User>;
  let userProgressRepo: Repository<UserProgress>;
  
  let testPuzzle: Puzzle;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    puzzleRepo = moduleFixture.get(getRepositoryToken(Puzzle));
    userRepo = moduleFixture.get(getRepositoryToken(User));
    userProgressRepo = moduleFixture.get(getRepositoryToken(UserProgress));

    // Create a test user
    testUser = userRepo.create({
      username: 'testuser',
      email: 'test@example.com',
      fullname: 'Test User',
      xp: 100,
      level: 1,
      puzzlesCompleted: 5
    });
    await userRepo.save(testUser);

    // Create a test puzzle
    testPuzzle = puzzleRepo.create({
      question: 'What has keys but can\'t open locks?',
      options: ['A piano', 'A map', 'A keyboard', 'A code'],
      correctAnswer: 'A piano',
      difficulty: PuzzleDifficulty.INTERMEDIATE,
      categoryId: 'test-category-id',
      points: 100,
      timeLimit: 60,
      explanation: 'A piano has keys (musical keys) but cannot open locks.'
    });
    await puzzleRepo.save(testPuzzle);
  });

  afterAll(async () => {
    // Clean up test data
    await userProgressRepo.delete({});
    await puzzleRepo.delete({});
    await userRepo.delete({});
    await app.close();
  });

  it('should submit correct answer and update user progression', async () => {
    const submitDto = {
      userId: testUser.id,
      puzzleId: testPuzzle.id,
      categoryId: testPuzzle.categoryId,
      userAnswer: 'A piano',
      timeSpent: 30
    };

    const res = await request(app.getHttpServer())
      .post('/puzzles/submit')
      .send(submitDto)
      .expect(201);

    expect(res.body).toMatchObject({
      isCorrect: true,
      pointsEarned: 110, // 100 base points + 10% time bonus (30s < 60s * 0.75)
      newXP: 210, // 100 + 110
      newLevel: 2, // Level calculation based on XP
      puzzlesCompleted: 6, // 5 + 1
      explanation: testPuzzle.explanation,
      timeMultiplier: 1.1
    });

    // Verify progress record was created
    const progressRecord = await userProgressRepo.findOne({
      where: {
        userId: testUser.id,
        puzzleId: testPuzzle.id
      }
    });
    
    expect(progressRecord).toBeDefined();
    if (progressRecord) {
      expect(progressRecord.isCorrect).toBe(true);
      expect(progressRecord.pointsEarned).toBe(110);
      expect(progressRecord.userAnswer).toBe('A piano');
    }
  });

  it('should submit wrong answer with 0 points', async () => {
    const submitDto = {
      userId: testUser.id,
      puzzleId: testPuzzle.id,
      categoryId: testPuzzle.categoryId,
      userAnswer: 'A map',
      timeSpent: 45
    };

    const res = await request(app.getHttpServer())
      .post('/puzzles/submit')
      .send(submitDto)
      .expect(201);

    expect(res.body).toMatchObject({
      isCorrect: false,
      pointsEarned: 0,
      newXP: 210, // Same as before since no points earned
      newLevel: 2,
      puzzlesCompleted: 6 // Same as before since answer was wrong
    });

    // Verify progress record was created with 0 points
    const progressRecord = await userProgressRepo.findOne({
      where: {
        userId: testUser.id,
        puzzleId: testPuzzle.id,
        userAnswer: 'A map'
      }
    });
    
    expect(progressRecord).toBeDefined();
    if (progressRecord) {
      expect(progressRecord.isCorrect).toBe(false);
      expect(progressRecord.pointsEarned).toBe(0);
    }
  });

  it('should reject submission for non-existent puzzle', async () => {
    const submitDto = {
      userId: testUser.id,
      puzzleId: 'non-existent-puzzle-id',
      categoryId: 'test-category-id',
      userAnswer: 'A piano',
      timeSpent: 30
    };

    await request(app.getHttpServer())
      .post('/puzzles/submit')
      .send(submitDto)
      .expect(404);
  });

  it('should reject duplicate submissions within 5 seconds', async () => {
    const submitDto = {
      userId: testUser.id,
      puzzleId: testPuzzle.id,
      categoryId: testPuzzle.categoryId,
      userAnswer: 'A piano',
      timeSpent: 25
    };

    // First submission
    await request(app.getHttpServer())
      .post('/puzzles/submit')
      .send(submitDto)
      .expect(201);

    // Duplicate submission within 5 seconds should fail
    await request(app.getHttpServer())
      .post('/puzzles/submit')
      .send(submitDto)
      .expect(400);
  });

  it('should apply time penalties for slow submissions', async () => {
    // Create another puzzle for testing
    const slowPuzzle = puzzleRepo.create({
      question: 'Slow puzzle test?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
      difficulty: PuzzleDifficulty.BEGINNER,
      categoryId: 'test-category-id',
      points: 50,
      timeLimit: 30
    });
    await puzzleRepo.save(slowPuzzle);

    const submitDto = {
      userId: testUser.id,
      puzzleId: slowPuzzle.id,
      categoryId: slowPuzzle.categoryId,
      userAnswer: 'Option 1',
      timeSpent: 40 // Exceeds time limit of 30s
    };

    const res = await request(app.getHttpServer())
      .post('/puzzles/submit')
      .send(submitDto)
      .expect(201);

    expect(res.body.pointsEarned).toBe(45); // 50 points * 0.9 penalty
    expect(res.body.timeMultiplier).toBe(0.9);
  });
});