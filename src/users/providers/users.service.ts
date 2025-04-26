import { Injectable } from '@nestjs/common';
import { FindOneByEmail } from './find-one-by-email.provider';

@Injectable()
export class UsersService {
  constructor(
     // @injecting intra dependency
        private readonly findOneByEmail: FindOneByEmail,
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

  public async create(data: any): Promise<void> {}

  public async update(id: string, data: any): Promise<void> {}

  public async delete(id: string): Promise<void> {}
}
