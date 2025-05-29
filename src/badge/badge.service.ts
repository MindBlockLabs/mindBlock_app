import { Injectable } from '@nestjs/common';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgeService {
  create(createBadgeDto: CreateBadgeDto) {
    return 'This action adds a new badge';
  }

  findAll() {
    return `This action returns all badge`;
  }

  findOne(id: number) {
    return `This action returns a #${id} badge`;
  }

  update(id: number, updateBadgeDto: UpdateBadgeDto) {
    return `This action updates a #${id} badge`;
  }

  remove(id: number) {
    return `This action removes a #${id} badge`;
  }
}
