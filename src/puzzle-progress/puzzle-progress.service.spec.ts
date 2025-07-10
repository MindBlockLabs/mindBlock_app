import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleCategory, Puzzle } from './puzzle.entity';
import { NotFoundException } from '@nestjs/common';

describe('PuzzleProgressService (Unit Tests)', () => {
  let service: PuzzleProgressService;
  let mockPuzzles: Puzzle[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PuzzleProgressService],
    }).compile();

    service = module.get<PuzzleProgressService>(PuzzleProgressService);
    mockPuzzles = service.getAllPuzzles();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordPuzzleSolve', () => {
    it('should record a puzzle solve for a new user and category', () => {
      const userId = 'user1';
      const puzzleId = mockPuzzles.find(p => p.category === PuzzleCategory.LOGIC && p.isPublished).id;
      service.recordPuzzleSolve(userId, puzzleId);

      const progress = service.getPuzzleProgress(userId);
      expect(progress[PuzzleCategory.LOGIC].completed).toBe(1);
    });

    it('should increment completed count for an existing user and category', () => {
      const userId = 'user2';
      const puzzleId1 = mockPuzzles.filter(p => p.category === PuzzleCategory.CODING && p.isPublished)[0].id;
      const puzzleId2 = mockPuzzles.filter(p => p.category === PuzzleCategory.CODING && p.isPublished)[1].id;

      service.recordPuzzleSolve(userId, puzzleId1);
      service.recordPuzzleSolve(userId, puzzleId2);

      const progress = service.getPuzzleProgress(userId);
      expect(progress[PuzzleCategory.CODING].completed).toBe(2);
    });

    it('should throw NotFoundException if puzzle is not found', () => {
      const userId = 'user3';
      const nonExistentPuzzleId = 'non-existent-puzzle';
      expect(() => service.recordPuzzleSolve(userId, nonExistentPuzzleId)).toThrow(NotFoundException);
      expect(() => service.recordPuzzleSolve(userId, nonExistentPuzzleId)).toThrow('Puzzle with ID "non-existent-puzzle" not found or is not published.');
    });

    it('should throw NotFoundException if puzzle is not published', () => {
      const userId = 'user4';
      const notPublishedPuzzleId = mockPuzzles.find(p => p.isPublished === false).id;
      expect(() => service.recordPuzzleSolve(userId, notPublishedPuzzleId)).toThrow(NotFoundException);
      expect(() => service.recordPuzzleSolve(userId, notPublishedPuzzleId)).toThrow(`Puzzle with ID "${notPublishedPuzzleId}" not found or is not published.`);
    });
  });

  describe('getPuzzleProgress', () => {
    it('should return initial progress for a user with no completed puzzles', () => {
      const userId = 'newUser';
      const progress = service.getPuzzleProgress(userId);

      Object.values(PuzzleCategory).forEach(category => {
        const totalPublishedPuzzlesInCategory = mockPuzzles.filter(p => p.category === category && p.isPublished).length;
        expect(progress[category].completed).toBe(0);
        expect(progress[category].total).toBe(totalPublishedPuzzlesInCategory);
      });
    });

    it('should return correct progress for a user with some completed puzzles', () => {
      const userId = 'userWithProgress';
      const logicPuzzleId = mockPuzzles.find(p => p.category === PuzzleCategory.LOGIC && p.isPublished).id;
      const codingPuzzleId = mockPuzzles.find(p => p.category === PuzzleCategory.CODING && p.isPublished).id;

      service.recordPuzzleSolve(userId, logicPuzzleId);
      service.recordPuzzleSolve(userId, codingPuzzleId);
      service.recordPuzzleSolve(userId, codingPuzzleId);

      const progress = service.getPuzzleProgress(userId);

      expect(progress[PuzzleCategory.LOGIC].completed).toBe(1);
      expect(progress[PuzzleCategory.CODING].completed).toBe(2);
      expect(progress[PuzzleCategory.BLOCKCHAIN].completed).toBe(0);
      expect(progress[PuzzleCategory.MATH].completed).toBe(0);
      expect(progress[PuzzleCategory.GENERAL].completed).toBe(0);

      expect(progress[PuzzleCategory.LOGIC].total).toBe(mockPuzzles.filter(p => p.category === PuzzleCategory.LOGIC && p.isPublished).length);
      expect(progress[PuzzleCategory.CODING].total).toBe(mockPuzzles.filter(p => p.category === PuzzleCategory.CODING && p.isPublished).length);
    });

    it('should handle cases where a category has no published puzzles', () => {
      const userId = 'userEmptyCategory';
     
      const progress = service.getPuzzleProgress(userId);

    });
  });
});


