import { Injectable } from '@nestjs/common';
import { FindCategoryByIdService } from './find-category-by-id.service';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly findCategoryByIdService: FindCategoryByIdService,
  ) {}

  /**
   * Find a category by ID (validates existence and active status)
   * @param id - Category UUID
   * @returns Category if valid
   * @throws NotFoundException if not found or inactive
   */
  public async findById(id: string): Promise<Category> {
    return this.findCategoryByIdService.execute(id);
  }
}
