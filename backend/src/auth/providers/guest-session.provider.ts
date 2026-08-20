import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ConvertGuestDto } from '../dtos/convert-guest.dto';
import { userRole } from '../../users/enums/userRole.enum';

export interface GuestSession {
  sessionId: string;
  role: userRole;
  createdAt: number;
  expiresAt: number;
  hintsUsed: number;
  maxHints: number;
  isConverted: boolean;
}

const GUEST_SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const GUEST_MAX_HINTS = 2;

@Injectable()
export class GuestSessionProvider {
  // In-memory store for guest sessions (or backed by Redis/DB)
  private readonly guestSessions = new Map<string, GuestSession>();

  constructor(private readonly configService: ConfigService) {}

  public createGuestSession(): GuestSession {
    const sessionId = `guest_${uuidv4()}`;
    const now = Date.now();
    const session: GuestSession = {
      sessionId,
      role: userRole.GUEST,
      createdAt: now,
      expiresAt: now + GUEST_SESSION_TIMEOUT_MS,
      hintsUsed: 0,
      maxHints: GUEST_MAX_HINTS,
      isConverted: false,
    };

    this.guestSessions.set(sessionId, session);
    return session;
  }

  public getGuestSessionStatus(sessionId: string): {
    valid: boolean;
    expired: boolean;
    session?: GuestSession;
    reason?: string;
  } {
    const session = this.guestSessions.get(sessionId);

    if (!session) {
      return {
        valid: false,
        expired: false,
        reason: 'Guest session not found',
      };
    }

    if (Date.now() > session.expiresAt) {
      return {
        valid: false,
        expired: true,
        session,
        reason: 'Guest session has expired (15-minute limit reached)',
      };
    }

    return {
      valid: true,
      expired: false,
      session,
    };
  }

  public validateGuestHintUsage(sessionId: string): {
    allowed: boolean;
    hintsRemaining: number;
  } {
    const status = this.getGuestSessionStatus(sessionId);

    if (!status.valid || status.expired) {
      throw new UnauthorizedException(
        status.reason ?? 'Guest session is invalid or expired',
      );
    }

    const session = status.session!;

    if (session.hintsUsed >= session.maxHints) {
      throw new ForbiddenException(
        `Guest users are limited to ${session.maxHints} hints. Please create an account for unlimited hints.`,
      );
    }

    session.hintsUsed += 1;
    this.guestSessions.set(sessionId, session);

    return {
      allowed: true,
      hintsRemaining: session.maxHints - session.hintsUsed,
    };
  }

  public validateGuestRewardClaim(sessionId: string): void {
    const status = this.getGuestSessionStatus(sessionId);

    if (status.session?.role === userRole.GUEST) {
      throw new ForbiddenException(
        'Guest users cannot claim XP or blockchain rewards. Please convert to a full account to claim rewards.',
      );
    }
  }

  public convertGuestToAccount(dto: ConvertGuestDto): {
    success: boolean;
    message: string;
    sessionId: string;
  } {
    const session = this.guestSessions.get(dto.guestSessionId);

    if (!session) {
      throw new NotFoundException('Guest session not found');
    }

    if (session.isConverted) {
      throw new BadRequestException('Guest session has already been converted');
    }

    session.isConverted = true;
    session.role = userRole.USER;
    this.guestSessions.set(dto.guestSessionId, session);

    return {
      success: true,
      message: 'Guest session successfully converted to authenticated account',
      sessionId: dto.guestSessionId,
    };
  }
}
