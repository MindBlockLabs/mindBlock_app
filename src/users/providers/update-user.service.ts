import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { EditUserDto } from '../dtos/editUserDto.dto';

@Injectable()
export class UpdateUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async editUser(id: string, editUserDto: EditUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Conditionally update fields
    user.firstName = editUserDto.firstName ?? user.firstName;
    user.lastName = editUserDto.lastName ?? user.lastName;
    user.email = editUserDto.email ?? user.email;
    user.password = editUserDto.password ?? user.password;

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user');
    }
  }
}
