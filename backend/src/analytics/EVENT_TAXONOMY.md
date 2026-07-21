# Analytics Event Taxonomy

This document defines the naming convention and schema for every `AnalyticsEvent.eventName` used across the project.

## Naming Convention

All event names MUST follow the pattern:

```
noun_pastTenseVerb
```

- `noun` — the object or domain being acted upon (e.g. `puzzle`, `streak`, `onboarding`)
- `pastTenseVerb` — the action in past tense (e.g. `attempted`, `completed`, `viewed`, `broken`)

### Examples

| ✓ Good                  | ✗ Bad                  |
|-------------------------|------------------------|
| `puzzle_attempted`      | `PuzzleAttempted`      |
| `streak_broken`         | `streak-broken`        |
| `onboarding_completed`  | `onboardingComplete`   |
| `tutorial_viewed`       | `tutorial_view`        |
| `profile_created`       | `createProfile`        |

A consistent naming convention ensures that all events can be queried and aggregated reliably across the entire platform.

## Registered Events

### `onboarding_started`

Emitted when a user begins the onboarding flow.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the starting user         |
| `metadata` | object | (empty)                              |

---

### `profile_created`

Emitted when a user completes their profile during onboarding.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ profileFieldsCompleted: number }` |

---

### `tutorial_viewed`

Emitted when a user views the tutorial.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ tutorialStep: string }`           |

---

### `first_puzzle_attempted`

Emitted when a user attempts their first puzzle.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ puzzleId: string, difficulty: string }` |

---

### `onboarding_completed`

Emitted when a user finishes the entire onboarding flow.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ timeToCompleteSeconds: number }`  |

---

### `puzzle_attempted`

Emitted each time a user submits an answer to a puzzle.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ puzzleId: string, difficulty: string, isCorrect: boolean, timeSpent: number }` |

---

### `streak_broken`

Emitted when a user's daily streak is broken after inactivity.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ previousStreakLength: number, lastActiveDate: string }` |

---

### `streak_updated`

Emitted when a user's daily streak is updated (incremented or maintained).

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ currentStreak: number, longestStreak: number }` |

---

### `daily_quest_completed`

Emitted when a user completes all puzzles in their daily quest.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ questDate: string, totalQuestions: number, bonusXpEarned: number }` |

---

### `login_occurred`

Emitted when a user logs in.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ method: string }`                 |

---

### `wallet_connected`

Emitted when a user connects a Stellar wallet.

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `userId`   | string | Identifies the user                  |
| `metadata` | object | `{ walletAddress: string }`          |

## Adding New Events

1. Choose a `noun_pastTenseVerb` name that fits the convention.
2. Add the event to the table in this document with its expected metadata shape.
3. Emit the event from the relevant provider using `TrackEventProvider.track()`:

```typescript
await this.trackEventProvider.track({
  eventName: 'your_new_event',
  userId: user.id,
  metadata: { /* ... */ },
});
```

4. Include the change in the same PR that introduces the event emission so the taxonomy stays in sync with the code.
