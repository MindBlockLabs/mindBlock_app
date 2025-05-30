import { Test, TestingModule } from '@nestjs/testing';
import { TimeFilterService } from './providers/timefilter.service';
import { TimeFilter } from './timefilter.enum.ts/timefilter.enum';



describe('TimeFilterService', () => {
  let service: TimeFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeFilterService],
    }).compile();

    service = module.get<TimeFilterService>(TimeFilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDateRange', () => {
    const now = new Date();

    it('should return null for ALL_TIME', () => {
      const result = service.getDateRange(TimeFilter.ALL_TIME);
      expect(result).toBeNull();
    });

    it('should return a date 7 days ago for WEEKLY', () => {
      const result = service.getDateRange(TimeFilter.WEEKLY);
      expect(result).toBeDefined();
      expect(result!.from).toBeInstanceOf(Date);
      const diff = now.getTime() - result!.from.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(Math.round(days)).toBe(7);
    });

    it('should return a date ~30 days ago for MONTHLY', () => {
      const result = service.getDateRange(TimeFilter.MONTHLY);
      expect(result).toBeDefined();
      expect(result!.from).toBeInstanceOf(Date);
      expect(result!.from.getMonth()).toBe((now.getMonth() + 11) % 12); // handles Jan -> Dec wrap
    });
  });
});