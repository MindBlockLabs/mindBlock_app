import { ChallengeValidationService } from './challenge-validation.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('ChallengeValidationService', () => {
  let service: ChallengeValidationService;

  beforeEach(() => {
    service = new ChallengeValidationService();
  });

  describe('validateAnswer', () => {
    it('should return true for an exact match', () => {
      expect(service.validateAnswer('4', '4')).toBe(true);
    });

    it('should return true for a case-insensitive match', () => {
      expect(service.validateAnswer('FOUR', 'four')).toBe(true);
    });

    it('should return true when answers differ only in whitespace', () => {
      expect(service.validateAnswer('  four  ', 'four')).toBe(true);
    });

    it('should return false for a wrong answer', () => {
      expect(service.validateAnswer('3', '4')).toBe(false);
    });

    it('should return false for an empty answer', () => {
      expect(service.validateAnswer('', '4')).toBe(false);
    });
  });

  describe('calculateScore', () => {
    it('should return base points when time equals the limit', () => {
      expect(service.calculateScore(100, 60, 60)).toBe(100);
    });

    it('should return a 50% bonus when completed immediately', () => {
      expect(service.calculateScore(100, 0, 60)).toBe(150);
    });

    it('should return a partial bonus when completed halfway through the limit', () => {
      expect(service.calculateScore(100, 30, 60)).toBe(125);
    });

    it('should return base points when time exceeds the limit', () => {
      expect(service.calculateScore(100, 90, 60)).toBe(100);
    });

    it('should return 0 when base points are 0', () => {
      expect(service.calculateScore(0, 10, 60)).toBe(0);
    });
  });
});
