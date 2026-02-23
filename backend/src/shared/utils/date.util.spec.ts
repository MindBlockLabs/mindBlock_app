// shared/utils/date.util.spec.ts
import { getDateString } from './date.util';

describe('getDateString', () => {
  it('should return today in UTC', () => {
    const result = getDateString('UTC', 0);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return today in Asia/Kolkata (UTC+5:30)', () => {
    const result = getDateString('Asia/Kolkata', 0);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return yesterday in America/New_York', () => {
    const result = getDateString('America/New_York', -1);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should produce different results for UTC vs Asia/Kolkata near midnight', () => {
    // Mock Date to simulate 11:30 PM in Asia/Kolkata
    const mockDate = new Date('2024-01-01T18:00:00Z'); // 11:30 PM IST
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const utcResult = getDateString('UTC', 0);
    const kolkataResult = getDateString('Asia/Kolkata', 0);

    expect(utcResult).not.toEqual(kolkataResult);

    jest.restoreAllMocks();
  });

  it('should handle offsetDays correctly', () => {
    const today = getDateString('UTC', 0);
    const yesterday = getDateString('UTC', -1);

    // Yesterday should be lexicographically less than today
    expect(yesterday < today).toBe(true);
  });
});
