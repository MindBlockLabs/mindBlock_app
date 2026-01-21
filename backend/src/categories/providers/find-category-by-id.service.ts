import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class FindCategoryByIdService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Finds a category by ID and validates it exists and is active
   * @param id - Category UUID
   * @returns Category if found and active
   * @throws NotFoundException if category not found or inactive
   */
  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (!category.isActive) {
      throw new NotFoundException(`Category with ID ${id} is not active`);
    }

    return category;
  }
}
