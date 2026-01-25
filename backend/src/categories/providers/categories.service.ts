import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dtos/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
        order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async findActive(): Promise<Category[]> {
    return this.categoryRepository.find({ where: { isActive: true } });
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    // Create category entity
    const category = this.categoryRepository.create(createCategoryDto);

    // Save to database
    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      // Handle unique constraint violation (in case of race condition)
      if (error.code === '23505') { // PostgreSQL unique violation code
        throw new ConflictException(
          `Category with name "${createCategoryDto.name}" already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    await this.categoryRepository.update(id, data);
    return this.categoryRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }
}