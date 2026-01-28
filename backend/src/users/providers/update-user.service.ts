import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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
    user.username = editUserDto.username ?? user.username;
    user.email = editUserDto.email ?? user.email;
    user.password = editUserDto.password ?? user.password;
    user.country = editUserDto.country ?? user.country;
    user.interests = editUserDto.interests ?? user.interests;
    user.occupation = editUserDto.occupation ?? user.occupation;
    user.goals = editUserDto.goals ?? user.goals;
    user.availableHours = editUserDto.availableHours ?? user.availableHours;
    user.bio = editUserDto.bio ?? user.bio;

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update user ${error}`);
    }
  }
}
