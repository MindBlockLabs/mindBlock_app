import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';

interface OAuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  public login(loginDto: LoginDto) {
    return `User with email ${loginDto.email} logged in successfully!`;
  }

  public register(name: string, email: string, password: string) {
    return `User ${name} registered successfully!`;
  }

  async validateOAuthUser(user: OAuthUser): Promise<string> {
    // Here you would typically:
    // 1. Check if user exists in your database
    // 2. If not, create a new user
    // 3. Generate and return JWT token

    // For now, we'll just generate a token
    const payload = {
      email: user.email,
      sub: user.email, // Using email as subject
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return this.jwtService.sign(payload);
  }
}
