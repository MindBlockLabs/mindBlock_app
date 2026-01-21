import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './providers/categories.service';
import { FindCategoryByIdService } from './providers/find-category-by-id.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoriesService, FindCategoryByIdService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
