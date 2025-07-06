# Daily Streak System

A comprehensive daily streak system that rewards users for solving at least one puzzle per day. This system tracks consecutive days of participation, resets if a day is missed, and provides bonus XP or tokens for milestone streaks.

## Features

- **Daily Streak Tracking**: Tracks consecutive days of puzzle solving
- **Milestone Rewards**: Awards bonus XP and tokens for reaching streak milestones
- **Event-Driven Architecture**: Uses NestJS event emitter for loose coupling
- **Leaderboard**: Shows top streak holders
- **Statistics**: Provides admin statistics for streak analytics
- **Automatic Integration**: Works with both puzzle and IQ assessment systems

## Architecture

### Components

1. **DailyStreak Entity** (`entities/daily-streak.entity.ts`)
   - Stores user streak data
   - Tracks current streak, longest streak, and milestone progress

2. **DailyStreakService** (`providers/daily-streak.service.ts`)
   - Core business logic for streak management
   - Handles streak updates, milestone checking, and leaderboard queries

3. **StreakController** (`controllers/streak.controller.ts`)
   - REST API endpoints for streak operations
   - Protected with JWT authentication

4. **StreakListener** (`listeners/streak.listener.ts`)
   - Event listener for puzzle and IQ question submissions
   - Automatically updates streaks when users solve puzzles correctly

5. **Constants** (`constants/streak.constants.ts`)
   - Configuration for milestones and rewards
   - Event names and system configuration

## API Endpoints

### Get Current Streak
```
GET /streak
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "streakCount": 5,
  "longestStreak": 10,
  "lastActiveDate": "2024-01-15T00:00:00.000Z",
  "hasSolvedToday": true,
  "nextMilestone": 7,
  "daysUntilNextMilestone": 2
}
```

### Get Streak Leaderboard
```
GET /streak/leaderboard?page=1&limit=10
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "entries": [
    {
      "userId": 1,
      "username": "user1",
      "streakCount": 15,
      "longestStreak": 20,
      "lastActiveDate": "2024-01-15T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get Streak Statistics (Admin)
```
GET /streak/stats
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "totalUsers": 100,
  "activeUsers": 50,
  "averageStreak": 5,
  "topStreak": 30
}
```

## Milestone System

The system awards bonus rewards at the following milestones:

| Streak Days | XP Reward | Token Reward | Description |
|-------------|-----------|--------------|-------------|
| 3           | 50        | 5            | 3-Day Streak |
| 7           | 150       | 15           | 7-Day Streak |
| 14          | 300       | 30           | 14-Day Streak |
| 30          | 600       | 60           | 30-Day Streak |
| 60          | 1200      | 120          | 60-Day Streak |
| 100         | 2000      | 200          | 100-Day Streak |

## Event System

The streak system uses events for loose coupling:

### Events Emitted
- `puzzle.submitted`: When a puzzle is submitted
- `iq.question.answered`: When an IQ question is answered
- `streak.puzzle.solved`: When a streak is updated
- `streak.milestone.reached`: When a milestone is reached

### Event Listeners
- `StreakListener`: Listens for puzzle and IQ question events
- `GamificationService`: Listens for milestone events to award rewards

## Database Schema

### daily_streaks Table
```sql
CREATE TABLE daily_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  last_active_date DATE NOT NULL,
  streak_count INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_milestone_reached INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

## Integration

### Puzzle System Integration
The streak system automatically integrates with the puzzle submission system:

1. User submits puzzle solution
2. `PuzzleService` emits `puzzle.submitted` event
3. `StreakListener` handles the event
4. If solution is correct, streak is updated
5. If milestone is reached, bonus rewards are awarded

### IQ Assessment Integration
Similar integration with IQ assessment system:

1. User answers IQ question
2. `IQAssessmentService` emits `iq.question.answered` event
3. `StreakListener` handles the event
4. If answer is correct, streak is updated

## Testing

The system includes comprehensive unit tests:

- `daily-streak.service.spec.ts`: Tests for core streak logic
- `streak.listener.spec.ts`: Tests for event handling
- `streak.controller.spec.ts`: Tests for API endpoints
- `puzzle.service.spec.ts`: Tests for puzzle integration

Run tests with:
```bash
npm run test src/gamification
```

## Configuration

### Environment Variables
No additional environment variables required. The system uses existing database and JWT configuration.

### Customization
To modify milestone rewards, update `src/gamification/constants/streak.constants.ts`:

```typescript
export const STREAK_MILESTONES = {
  3: { xp: 50, tokens: 5, description: '3-Day Streak' },
  // Add or modify milestones here
};
```

## Usage Examples

### Frontend Integration
```typescript
// Get current user streak
const streak = await api.get('/streak');

// Display streak information
console.log(`Current streak: ${streak.streakCount} days`);
console.log(`Longest streak: ${streak.longestStreak} days`);
console.log(`Next milestone: ${streak.nextMilestone} days`);

// Get leaderboard
const leaderboard = await api.get('/streak/leaderboard?page=1&limit=10');
```

### Backend Integration
```typescript
// Inject DailyStreakService
constructor(private readonly streakService: DailyStreakService) {}

// Update streak manually (if needed)
const streak = await this.streakService.updateStreak(userId);

// Get streak statistics
const stats = await this.streakService.getStreakStats();
```

## Best Practices

1. **Event-Driven**: Use events for loose coupling between systems
2. **Error Handling**: Streak updates should not break puzzle submission flow
3. **Idempotency**: Users can only update streak once per day
4. **Performance**: Use database indexes for leaderboard queries
5. **Testing**: Comprehensive test coverage for all business logic

## Future Enhancements

- **Streak Multipliers**: Bonus multipliers for longer streaks
- **Streak Challenges**: Special challenges for maintaining streaks
- **Streak Analytics**: More detailed analytics and insights
- **Streak Notifications**: Push notifications for streak reminders
- **Streak Sharing**: Social features for sharing streak achievements 