import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {}

  async findAll(): Promise<any[]> {
    return [];
  }

  async findOne(): Promise<any> {
    return null;
  }

  async create(data: any): Promise<void> {}

  async update(id: string, data: any): Promise<void> {}

  async delete(id: string): Promise<void> {}
}
