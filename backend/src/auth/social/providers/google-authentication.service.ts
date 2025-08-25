/* eslint-disable prettier/prettier */
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import jwtConfig from '../../../auth/authConfig/jwt.config';
import { GoogleTokenDto } from '../dtos/google-token.dto';
import { UsersService } from '../../../users/providers/users.service';
import { GenerateTokensProvider } from '../../../auth/providers/generate-tokens.provider';

/**
 * @class GoogleAuthenticationService
 * @description Handles Google authentication using OAuth2.
 */
@Injectable()
/**Google authentication service */
export class GoogleAuthenticationService implements OnModuleInit {
  private oAuthClient: OAuth2Client;

  private readonly logger = new Logger(GoogleAuthenticationService.name);
  constructor(
    /**
     * Injects the UserService for user-related operations.
     */
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    /**
     * Injects the JWT configuration.
     */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfigurattion: ConfigType<typeof jwtConfig>,

    /**
     * Injects the GenerateTokensProvider to handle token generation.
     */
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /**
   * Initializes the OAuth2 client with Google credentials.
   */
  onModuleInit() {
    const client_id = this.jwtConfigurattion.googleClient_id;
    const client_secret = this.jwtConfigurattion.googleClient_secret;

    this.oAuthClient = new OAuth2Client(client_id, client_secret);
  }

  /**
   * Authenticates a user with a Google token.
   *
   * @param {GoogleTokenDto} googleTokenDto - The DTO containing the Google token.
   * @returns {Promise<any>} Returns generated tokens if authentication is successful.
   * @throws {UnauthorizedException} If authentication fails.
   */

  /**authenticate class with google tokendto as params */
  public async authenticate(googleTokenDto: GoogleTokenDto) {
    try {
      console.log('Received Token:', googleTokenDto.token);

      this.logger.log('Initializing OAuth Client...');
      try {
        this.oAuthClient = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI,
        );

        if (!this.oAuthClient) {
          throw new Error('OAuth Client is undefined after initialization');
        }
      } finally {
        console.log('oAuth Ended');
      }
      // Verify the Google token sent by user
      const loginTicket = await this.oAuthClient.verifyIdToken({
        idToken: googleTokenDto.token,
      });

      console.log('Google Token Payload:', loginTicket);

      // Get the payload then store it
      const payload = loginTicket.getPayload();

      // Check if it's defined,
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload.');
      }

      // Destructure only after ensuring payload is not undefined
      // Extract the payload from Google JWT token
      const { email, sub: googleId, given_name } = payload;

      // Find the user in the database using googleId
      const user = await this.userService.findOneByGoogleId(googleId);

      // If user exists, generate token
      if (user) {
        return this.generateTokensProvider.generateTokens(user);
      }

      if (!email || !googleId) {
        throw new UnauthorizedException('Incomplete Google token data.');
      }

      // Else, create a new user and generate the token
      const newUser = await this.userService.createGoogleUser({
        email: email,
        username: given_name,
        // eslint-disable-next-line prettier/prettier
        googleId: googleId,
      });
      return this.generateTokensProvider.generateTokens(newUser);
    } catch (error) {
      // If any step fails, throw an UnauthorizedException
      console.error('Google Auth Error:', error);
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }
}
