import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserProgress } from '../entities/progress.entity';

interface CategoryStatsRaw {
  categoryId: string;
  totalAttempts: string;
  correctAnswers: string;
}

interface CategoryNameRaw {
  category_name: string;
}

@Injectable()
export class GetCategoryStatsProvider {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async getCategoryStats(userId: string, categoryId: string) {
    const where: FindOptionsWhere<UserProgress> = {
      userId,
      categoryId,
    };

    const progressRecords = await this.progressRepo.find({
      where,
      relations: ['category'],
    });

    if (progressRecords.length === 0) {
      return {
        categoryId,
        categoryName: '',
        totalAttempts: 0,
        correctAnswers: 0,
        accuracy: 0,
      };
    }

    const totalAttempts = progressRecords.length;
    const correctAnswers = progressRecords.reduce(
      (sum, record) => sum + (record.isCorrect ? 1 : 0),
      0,
    );

    const accuracy =
      totalAttempts > 0
        ? Math.round((correctAnswers / totalAttempts) * 100)
        : 0;

    const categoryName = progressRecords[0]?.category?.name || '';

    return {
      categoryId,
      categoryName,
      totalAttempts,
      correctAnswers,
      accuracy,
    };
  }
}
