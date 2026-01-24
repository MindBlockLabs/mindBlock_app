import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  @Get()
  async findAll() {
    try {
      const categories = await this.categoriesRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });

      return {
        success: true,
        data: categories,
        count: categories.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message,
      };
    }
  }
}