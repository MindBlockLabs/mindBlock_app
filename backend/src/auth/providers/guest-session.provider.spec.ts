import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { GuestSessionProvider } from './guest-session.provider';

describe('GuestSessionProvider', () => {
  let provider: GuestSessionProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestSessionProvider,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    provider = module.get<GuestSessionProvider>(GuestSessionProvider);
  });

  it('should create a 15-minute guest session with 2 hints limit', () => {
    const session = provider.createGuestSession();
    expect(session.sessionId).toContain('guest_');
    expect(session.maxHints).toBe(2);
    expect(session.expiresAt - session.createdAt).toBe(15 * 60 * 1000);
  });

  it('should validate guest session status server-side', () => {
    const session = provider.createGuestSession();
    const status = provider.getGuestSessionStatus(session.sessionId);
    expect(status.valid).toBe(true);
    expect(status.expired).toBe(false);
  });

  it('should restrict hints to maximum 2 for guest sessions', () => {
    const session = provider.createGuestSession();

    expect(provider.validateGuestHintUsage(session.sessionId).hintsRemaining).toBe(1);
    expect(provider.validateGuestHintUsage(session.sessionId).hintsRemaining).toBe(0);

    expect(() => provider.validateGuestHintUsage(session.sessionId)).toThrow(ForbiddenException);
  });

  it('should prevent guest users from claiming rewards', () => {
    const session = provider.createGuestSession();
    expect(() => provider.validateGuestRewardClaim(session.sessionId)).toThrow(ForbiddenException);
  });

  it('should convert guest session to authenticated account', () => {
    const session = provider.createGuestSession();
    const result = provider.convertGuestToAccount({
      guestSessionId: session.sessionId,
      email: 'guest@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    const updatedStatus = provider.getGuestSessionStatus(session.sessionId);
    expect(updatedStatus.session?.isConverted).toBe(true);
  });
});
