import { Injectable } from '@nestjs/common';
import { FindOneByEmail } from './find-one-by-email.provider';
import { CreateUserService } from './create-user.service';
import { User } from '../user.entity';

@Injectable()
export class UsersService {
  constructor(
     // @injecting intra dependency
        private readonly findOneByEmail: FindOneByEmail,
        private createUserService: CreateUserService,

  ) {}

  public async findAll(): Promise<any[]> {
    return [];
  }

  public async findOne(): Promise<any> {
    return null;
  }

  public async GetOneByEmail(email: string) {
    return this.findOneByEmail.FindOneByEmail(email)
}

  public async create(userData: any): Promise<User> {
    return this.createUserService.execute(userData);
  }

  public async update(id: string, data: any): Promise<void> {}

  public async delete(id: string): Promise<void> {}
}
