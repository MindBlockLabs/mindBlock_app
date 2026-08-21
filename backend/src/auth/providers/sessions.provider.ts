import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { User } from '../../users/user.entity';
import * as crypto from 'crypto';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../authConfig/jwt.config';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { UsersService } from '../../users/providers/users.service';

@Injectable()
export class SessionsProvider {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

    private readonly generateTokensProvider: GenerateTokensProvider,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Hash a refresh token for secure storage
   */
  private hashRefreshToken(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }

  /**
   * Create a new session for a user
   */
  public async createSession(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // Generate new tokens
    const tokens = await this.generateTokensProvider.generateTokens(user);

    // Calculate refresh token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.jwtConfiguration.refreshTokenTtl,
    );

    // Hash the refresh token before storing
    const refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);

    // Create and save the session
    const session = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
      isActive: true,
    });

    await this.sessionRepository.save(session);

    return tokens;
  }

  /**
   * Validate and rotate refresh token (token rotation for security)
   */
  public async refreshSession(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    // Find the session with matching hash that is still active and not expired
    const session = await this.sessionRepository.findOne({
      where: {
        refreshTokenHash,
        isActive: true,
      },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      // Invalidate the expired session
      session.isActive = false;
      await this.sessionRepository.save(session);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Invalidate the old session (token rotation)
    session.isActive = false;
    await this.sessionRepository.save(session);

    // Create a new session with new tokens
    return this.createSession(session.user, deviceInfo, ipAddress);
  }

  /**
   * Invalidate a specific session (logout)
   */
  public async invalidateSession(refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      where: { refreshTokenHash },
    });

    if (session) {
      session.isActive = false;
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Invalidate all sessions for a user (logout from all devices)
   */
  public async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  /**
   * Get all active sessions for a user
   */
  public async getUserActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Clean up expired sessions (can be run as a cron job)
   */
  public async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.update(
      { expiresAt: new Date(), isActive: true },
      { isActive: false },
    );
  }
}