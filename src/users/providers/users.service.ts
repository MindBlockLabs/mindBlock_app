// src/users/providers/users.service.ts

import { Injectable } from '@nestjs/common';
import { FindOneByEmail } from './find-one-by-email.provider';
import { CreateUserService } from './create-user.service';
import { DeleteUserService } from './delete-user.service'; // <-- import DeleteUserService
import { User } from '../user.entity';
import { FindOneByGoogleIdProvider } from './find-one-by-googleId';
import { ApiOperation } from '@nestjs/swagger';
import { CreateGoogleUserProvider } from './googleUserProvider';
import { GoogleInterface } from 'src/auth/social/interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly findOneByEmail: FindOneByEmail,
    private readonly createUserService: CreateUserService,
    private readonly deleteUserService: DeleteUserService, // <-- injected delete a user
        private readonly findOneByGoogleIdProvider: FindOneByGoogleIdProvider,

        private readonly createGoogleUserProvider: CreateGoogleUserProvider,
  ) {}

  public async findAll(): Promise<any[]> {
    return [];
  }

  public async findOne(): Promise<any> {
    return null;
  }

  public async GetOneByEmail(email: string) {
    return this.findOneByEmail.findOneByEmail(email)
}

  public async create(userData: any): Promise<User> {
    return this.createUserService.execute(userData);
  }

  /**
   * Create a new Google user.
   */
  @ApiOperation({ summary: 'Create a new Google user' })
  public async createGoogleUser(googleUser: GoogleInterface) {
    return this.createGoogleUserProvider.createGoogleUser(googleUser);
  }

  /**
   * Find a user by Google ID.
   */
  @ApiOperation({ summary: 'Find a user by Google ID' })
  public async findOneByGoogleId(googleId: string) {
    return this.findOneByGoogleIdProvider.findOneByGoogleId(googleId);
  }

  public async update(id: string, data: any): Promise<void> {}

  public async delete(id: string): Promise<void> {
    return this.deleteUserService.execute(id); // <-- use the new DeleteUserService
  }
}
