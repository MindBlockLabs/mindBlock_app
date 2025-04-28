// src/users/providers/users.service.ts

import { Injectable } from '@nestjs/common';
import { FindOneByEmail } from './find-one-by-email.provider';
import { CreateUserService } from './create-user.service';
import { DeleteUserService } from './delete-user.service'; // <-- import DeleteUserService
import { User } from '../user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly findOneByEmail: FindOneByEmail,
    private readonly createUserService: CreateUserService,
    private readonly deleteUserService: DeleteUserService, // <-- injected delete a user
  ) {}

  public async findAll(): Promise<any[]> {
    return [];
  }

  public async findOne(): Promise<any> {
    return null;
  }

  public async GetOneByEmail(email: string) {
    return this.findOneByEmail.FindOneByEmail(email);
  }

  public async create(userData: any): Promise<User> {
    return this.createUserService.execute(userData);
  }

  public async update(id: string, data: any): Promise<void> {}

  public async delete(id: string): Promise<void> {
    return this.deleteUserService.execute(id); // <-- use the new DeleteUserService
  }
}
