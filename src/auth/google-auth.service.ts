import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import axios from 'axios';

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /** Called by the controller after Google redirects back with a token */
  async handleGoogleLogin(idToken: string) {
    // 1. Verify ID token with Google
    const googleApiUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const response = await axios.get(googleApiUrl);
    const payload = response.data as {
      email: string;
      sub: string;
      given_name: string;
      family_name: string;
      // other fields...
    };

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { email, sub: googleId, given_name, family_name } = payload;

    // 2. Construct a username: given_name + first letter of family_name
    const rawUsername = `${given_name}${family_name ? family_name.charAt(0) : ''}`.toLowerCase();

    // 3. Ensure uniqueness: if taken, append random digits until unique
    let username = rawUsername;
    let counter = 0;
    while (await this.usersService.findByUsername(username)) {
      counter += 1;
      username = `${rawUsername}${counter}`;
    }

    // 4. Look up user by googleId
    let user = await this.usersService.findOneByGoogleId(googleId);

    if (!user) {
      // 5. If not exist, create a new user
      try {
        user = await this.usersService.create({
          username,
          email,
          googleId,
          // no password for OAuth users
        } as any);
      } catch (e) {
        if (e instanceof ConflictException) {
          // Should rarely happen—username/email conflict
          throw new ConflictException(
            'Could not create user: username or email conflict',
          );
        }
        throw e;
      }
    }

    // 6. Issue tokens
    const tokens = await this.generateTokensProvider.generateTokens(user);
    return { user, tokens };
  }
}
