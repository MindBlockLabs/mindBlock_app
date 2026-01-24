import { Controller, Get, UseGuards } from '@nestjs/common';
import { CategoriesProvider } from './providers/categories.provider';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesProvider: CategoriesProvider) {}

  @Get()
  async getAllActiveCategories(): Promise<Category[]> {
    return await this.categoriesProvider.findAllActive();
  }
}