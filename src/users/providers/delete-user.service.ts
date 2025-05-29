// src/users/providers/delete-user.service.ts

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DeleteUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: Number(id) } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    try {
      await this.userRepository.delete(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete user.');
    }
  }
}
