import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, password: string) {
    return `User with email ${email} logged in successfully!`;
  }

  register(name: string, email: string, password: string) {
    return `User ${name} registered successfully!`;
  }
}
