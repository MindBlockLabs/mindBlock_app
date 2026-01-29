import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/progress.entity';
import { CategoryStatsDto } from '../dtos/category-stats.dto';

@Injectable()
export class GetCategoryStatsProvider {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async getCategoryStats(userId: string, categoryId: string) {
    const result = await this.progressRepo
      .createQueryBuilder('progress')
      .select('progress.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'totalAttempts')
      .addSelect('SUM(CASE WHEN progress.isCorrect = true THEN 1 ELSE 0 END)', 'correctAnswers')
      .where('progress.userId = :userId', { userId })
      .andWhere('progress.categoryId = :categoryId', { categoryId })
      .groupBy('progress.categoryId')
      .getRawOne();

    if (!result) {
      return {
        categoryId,
        categoryName: '',
        totalAttempts: 0,
        correctAnswers: 0,
        accuracy: 0,
      };
    }

    const totalAttempts = parseInt(result.totalAttempts, 10) || 0;
    const correctAnswers = parseInt(result.correctAnswers, 10) || 0;
    const accuracy =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    // Get category name
    const category = await this.progressRepo
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.category', 'category')
      .where('progress.categoryId = :categoryId', { categoryId })
      .select('category.name')
      .limit(1)
      .getRawOne();

    return {
      categoryId,
      categoryName: category?.category_name || '',
      totalAttempts,
      correctAnswers,
      accuracy,
    };
  }
}
