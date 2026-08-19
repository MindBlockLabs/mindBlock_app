/**
 * Lifecycle states for a GameSession.
 *
 * Valid transitions:
 *   CREATED  → ACTIVE
 *   ACTIVE   → PAUSED | COMPLETED | ABANDONED | EXPIRED
 *   PAUSED   → ACTIVE | ABANDONED | EXPIRED
 *   COMPLETED → (terminal)
 *   EXPIRED   → (terminal)
 *   ABANDONED → (terminal)
 */
export enum GameSessionStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  ABANDONED = 'ABANDONED',
}
