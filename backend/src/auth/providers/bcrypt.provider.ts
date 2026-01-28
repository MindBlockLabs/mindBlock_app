import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HashingProvider } from './hashing.provider';

@Injectable()
export class BcryptProvider implements HashingProvider {
  // hash
  public async hashPassword(inpPassword: string | Buffer): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    return await bcrypt.hash(inpPassword.toLocaleString(), salt);
  }

  // compare
  public async comparePasswords(
    password: string,
    encryPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, encryPassword);
  }
}
