import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dtos/create-category.dto';

@Injectable()
export class CategoriesProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAllActive(): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch active categories: ${error.message}`);
    }
  }

  async findById(id: number): Promise<Category | null> {
    try {
      return await this.categoryRepository.findOne({
        where: { id, isActive: true },
      });
    } catch (error) {
      throw new Error(`Failed to fetch category by ID: ${error.message}`);
    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const category = this.categoryRepository.create({
        ...createCategoryDto,
        isActive: createCategoryDto.isActive ?? true,
      });
      return await this.categoryRepository.save(category);
    } catch (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  async update(id: number, updateData: Partial<CreateCategoryDto>): Promise<Category> {
    try {
      const category = await this.findById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      Object.assign(category, updateData);
      return await this.categoryRepository.save(category);
    } catch (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const category = await this.findById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      await this.categoryRepository.remove(category);
    } catch (error) {
      throw new Error(`Failed to remove category: ${error.message}`);
    }
  }
}