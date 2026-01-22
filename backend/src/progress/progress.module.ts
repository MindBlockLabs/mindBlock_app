import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgress])],
  exports: [TypeOrmModule],
})
export class ProgressModule {}
