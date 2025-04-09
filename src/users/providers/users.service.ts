import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {}

  public async findAll(): Promise<any[]> {
    return [];
  }

  public async findOne(): Promise<any> {
    return null;
  }

  public async create(data: any): Promise<void> {}

  public async update(id: string, data: any): Promise<void> {}

  public async delete(id: string): Promise<void> {}
}
