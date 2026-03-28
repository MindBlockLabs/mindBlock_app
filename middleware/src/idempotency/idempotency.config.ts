export const IDEMPOTENCY_CONFIG = {
  ttl: {
    puzzleSubmission: 300, // 5 minutes
    pointClaim: 600,       // 10 minutes
    friendRequest: 3600,   // 1 hour
    profileUpdate: 60,     // 1 minute
  },
  headerKey: 'x-idempotency-key',
};
