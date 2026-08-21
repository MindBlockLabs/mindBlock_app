# API Reference

The Mind Block backend is a NestJS HTTP API. This document is a hand-written
overview of the surface area; the generated, always-current contract is the
Swagger UI the app serves at runtime.

| Environment | Base URL | Swagger UI |
| ----------- | -------- | ---------- |
| Local | `http://localhost:3000` | <http://localhost:3000/api> |
| Hosted | `https://mindblock-webaapp.onrender.com` | `https://mindblock-webaapp.onrender.com/api` |

The Swagger document is built in `backend/src/main.ts` and mounted at `/api`.

---

## Conventions

### Content type

All request and response bodies are JSON. Send `Content-Type: application/json`
on any request with a body.

### Authentication

Authentication is a JWT bearer token:

```http
Authorization: Bearer <accessToken>
```

`JwtAuthMiddleware` is applied globally in `backend/src/app.module.ts` and
excludes only these public prefixes:

- `/auth/*`
- `/api` (Swagger UI)
- `/docs`
- `/health`

Every other route requires a valid token. Obtain one from `POST /auth/signIn`,
`POST /auth/stellar-wallet-login`, or the Google endpoint, and refresh it with
`POST /auth/refreshToken`.

Handlers that use the `@ActiveUser()` decorator read the user from the verified
token, so you do not pass a user ID for those endpoints.

### Validation

A global `ValidationPipe` runs with `whitelist: true`,
`forbidNonWhitelisted: true`, and `transform: true`. Unknown properties are a
`400`, not a silent strip:

```json
{
  "statusCode": 400,
  "message": ["property nickname should not exist"],
  "error": "Bad Request"
}
```

### Errors

`AllExceptionsFilter` catches everything, so non-HTTP exceptions still return
structured JSON rather than a raw stack trace. Every request is stamped with a
correlation ID by `CorrelationIdMiddleware`; include it when reporting a bug.

| Status | Meaning |
| ------ | ------- |
| 400 | Validation failure or malformed payload. |
| 401 | Missing, expired, or invalid bearer token. |
| 403 | Authenticated but not permitted (admin routes, shutdown, bad admin key). |
| 404 | Resource does not exist. |
| 429 | Rate limit exceeded (`@nestjs/throttler`). |
| 500 | Unhandled server error. |

### Rate limiting

Throttling is applied per route where it matters, for example
`GET /auth/stellar-wallet-nonce` allows 5 requests per minute and
`POST /analytics/track` allows 20 per minute.

### Pagination

List endpoints that paginate accept:

| Query | Type | Default |
| ----- | ---- | ------- |
| `page` | positive integer | `1` |
| `limit` | positive integer | `10` |

Paginated responses carry `data`, a `meta` block (`itemsPerPage`, `totalItems`,
`currentPage`, `totalPages`) and a `links` block (`first`, `last`, `current`,
`previous`, `next`).

### CORS

CORS is currently open (`origin: '*'`) with `GET`, `POST`, `PUT`, `DELETE`, and
`OPTIONS` allowed, and `Content-Type` and `Authorization` accepted as headers.

---

## Endpoint index

| Area | Base path | Auth |
| ---- | --------- | ---- |
| Root | `/` | Public |
| Auth | `/auth` | Public |
| Google auth | `/auth/google-authentication` | Public |
| Health | `/health` | Public (`/health/detailed` needs an admin key) |
| Users | `/users` | Bearer |
| Puzzles | `/puzzles` | Bearer |
| Categories | `/categories` | Bearer |
| Game sessions | `/game-sessions` | Bearer or guest ID |
| Challenge attempts | `/challenge-attempts` | Bearer |
| Progress | `/progress` | Bearer |
| Daily quest | `/daily-quest` | Bearer |
| Streaks | `/streaks` | Bearer |
| Analytics | `/analytics` | Bearer (retention is admin-only) |
| Blockchain | `/blockchain` | Bearer |
| Admin IQ questions | `/admin/iq-questions` | Bearer + `ADMIN` role |

---

## 1. Root

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/` | Service greeting from `AppController`. |

---

## 2. Auth (`/auth`)

All routes are public.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/auth/signIn` | Email and password sign-in. |
| `POST` | `/auth/refreshToken` | Exchange a refresh token for a new access token. |
| `POST` | `/auth/guest-session` | Create a 15-minute guest session. Returns `201`. |
| `GET` | `/auth/guest-session/:sessionId/status` | Guest session status and expiry. |
| `POST` | `/auth/guest-session/:sessionId/hint` | Consume a guest hint. Max 2; `403` once exhausted. |
| `POST` | `/auth/convert-guest` | Convert a guest session into a real account. |
| `GET` | `/auth/stellar-wallet-nonce?walletAddress=G...` | Nonce to sign. Expires in 5 minutes. Throttled to 5/min. |
| `GET` | `/auth/stellar-wallet-nonce/status` | Inspect an issued nonce. |
| `POST` | `/auth/stellar-wallet-login` | Log in with a signed nonce. |
| `POST` | `/auth/forgot-password` | Send a password reset mail. |
| `POST` | `/auth/reset-password/:token` | Set a new password using the emailed token. |
| `POST` | `/auth/google-authentication` | Exchange a Google ID token for app credentials. |

### `POST /auth/signIn`

```json
{
  "email": "player@example.com",
  "password": "Password123!"
}
```

Returns the access token (and refresh token) used for every protected route.
`401` on invalid credentials.

### `POST /auth/refreshToken`

```json
{ "refreshToken": "some-refresh-token" }
```

`400` when the refresh token is invalid or expired.

### Stellar wallet login

Three steps:

```bash
# 1. Ask for a nonce
curl "http://localhost:3000/auth/stellar-wallet-nonce?walletAddress=GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A"
# -> { "nonce": "stellar_nonce_...", "expiresAt": 1693123756789 }

# 2. Sign the nonce in the wallet (Freighter, xBull, Albedo)

# 3. Exchange the signature for a token
curl -X POST http://localhost:3000/auth/stellar-wallet-login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A",
    "signature": "base64SignatureString==",
    "nonce": "stellar_nonce_1693123456789_abc123_BTODB4A",
    "publicKey": "GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A"
  }'
# -> { "accessToken": "..." }
```

`400` for a malformed address or an expired nonce, `401` for a bad signature.

### `POST /auth/convert-guest`

```json
{
  "guestSessionId": "guest_...",
  "email": "player@example.com",
  "password": "Password123!",
  "walletAddress": "G..."
}
```

`email`/`password` and `walletAddress` are both optional individually; supply
whichever identity the player is upgrading to.

### Password reset

```json
// POST /auth/forgot-password
{ "email": "player@example.com" }

// POST /auth/reset-password/:token
{ "password": "NewPassword123!" }
```

Requires working SMTP configuration; see
[ENVIRONMENT.md](./ENVIRONMENT.md#17-mail-smtp).

---

## 3. Health (`/health`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Basic liveness plus status summary. |
| `GET` | `/health/live` | Kubernetes liveness probe. |
| `GET` | `/health/ready` | Readiness probe. `403` when dependencies are unhealthy. |
| `GET` | `/health/detailed` | Full dependency detail. Requires the `x-admin-key` header to match `ADMIN_HEALTH_KEY`. |

During graceful shutdown these endpoints return `403` so load balancers drain
traffic before the process exits.

```bash
curl -H "x-admin-key: $ADMIN_HEALTH_KEY" http://localhost:3000/health/detailed
```

---

## 4. Users (`/users`)

Bearer token required.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/users?page=1&limit=10` | Paginated user list. |
| `GET` | `/users/:id` | Single user. |
| `GET` | `/users/:id/xp-level` | XP total and derived level. |
| `POST` | `/users` | Create a user. |
| `PATCH` | `/users/:id` | Update a user profile. |
| `DELETE` | `/users/:id` | Delete a user. |

`POST /users` accepts `email`, `username`, `fullname`, `password`, `userRole`,
`walletAddress`, `publicKey`, `provider`, and `googleId`; all are optional at the
DTO level, so supply the identity fields relevant to the account type.

`PATCH /users/:id` accepts `name`, `username`, and `avatar`.

---

## 5. Puzzles (`/puzzles`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/puzzles` | Create a puzzle. `201` on success. |
| `GET` | `/puzzles` | List puzzles, filterable. |
| `GET` | `/puzzles/daily-quest` | Puzzles making up today's daily quest. |
| `GET` | `/puzzles/:id` | Single puzzle. |

Create body:

```json
{
  "question": "Which data structure gives O(1) average lookup?",
  "options": ["Array", "Hash map", "Linked list", "Binary tree"],
  "correctAnswer": "Hash map",
  "difficulty": "INTERMEDIATE",
  "categoryId": "8e2f...",
  "points": 20,
  "timeLimit": 60,
  "explanation": "Hashing gives constant-time average access."
}
```

`points` and `explanation` are optional. `400` if the category does not exist or
is inactive.

List filters:

| Query | Description |
| ----- | ----------- |
| `categoryId` | Restrict to one category. |
| `difficulty` | One of the `PuzzleDifficulty` values: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`. |

---

## 6. Categories (`/categories`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/categories` | Create a category. |
| `GET` | `/categories?isActive=true` | List categories, optionally filtered by active state. |

```json
{
  "name": "Logic",
  "description": "Deductive reasoning puzzles",
  "icon": "brain",
  "isActive": true
}
```

Only `name` is required.

---

## 7. Game sessions (`/game-sessions`)

A game session is one play-through: a set of challenges, a score, and XP.
Authenticated players are identified by their token; guests pass `guestId`.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/game-sessions` | Start a session. |
| `GET` | `/game-sessions` | Sessions for the current user. |
| `GET` | `/game-sessions/active` | The user's currently active session. |
| `GET` | `/game-sessions/:id?guestId=...` | Fetch one session. `:id` must be a UUID. |
| `PATCH` | `/game-sessions/:id/status?guestId=...` | Update status, score, and XP. |

Create body:

```json
{
  "challengeCount": 10,
  "difficulty": "INTERMEDIATE",
  "selectedCategories": ["8e2f...", "b41c..."],
  "guestId": "guest_..."
}
```

Only `challengeCount` is required; `guestId` is for unauthenticated play.

Status update body (`GameSessionStatus`: `CREATED`, `ACTIVE`, `PAUSED`, `COMPLETED`, `EXPIRED`, `ABANDONED`):

```json
{ "status": "COMPLETED", "score": 80, "xpEarned": 120 }
```

Response shape: `id`, `status`, `challengeCount`, `currentChallenge`, `score`,
`xpEarned`, `createdAt`, `updatedAt`.

---

## 8. Challenge attempts (`/challenge-attempts`)

The execution ledger: one record per challenge a player takes on.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/challenge-attempts` | Begin an attempt. |
| `POST` | `/challenge-attempts/submit` | Submit an answer. |
| `PATCH` | `/challenge-attempts/hint` | Consume a hint. |
| `PATCH` | `/challenge-attempts/reveal` | Reveal the solution. |
| `PATCH` | `/challenge-attempts/:id/expire` | Mark an attempt expired. |
| `GET` | `/challenge-attempts/:id` | One attempt. |
| `GET` | `/challenge-attempts/user/:userId` | All attempts by a user. |
| `GET` | `/challenge-attempts/session/:sessionId` | All attempts in a session. |

```json
// POST /challenge-attempts
{ "userId": "...", "challengeId": "...", "sessionId": "..." }

// POST /challenge-attempts/submit
{ "attemptId": "...", "answer": "Hash map", "timeSpent": 24 }

// PATCH /challenge-attempts/hint  and  /reveal
{ "attemptId": "..." }
```

`timeSpent` is in seconds. Scoring is decided server-side.

---

## 9. Progress (`/progress`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/progress?page=1&limit=10` | Paginated attempt history for the current user. |
| `GET` | `/progress/stats` | Overall statistics. |
| `GET` | `/progress/category/:id` | Statistics for one category. |
| `POST` | `/progress/submit` | Submit an answer and record progress. |

History entries contain `id`, `puzzleId`, `question`, `userAnswer`,
`isCorrect`, `pointsEarned`, `timeSpent`, `attemptedAt`, and `categoryId`.

`GET /progress/stats` returns `totalAttempts`, `totalCorrect`, `accuracy`,
`totalPointsEarned`, and `totalTimeSpent`. The category variant returns
`categoryId`, `categoryName`, `totalAttempts`, `correctAnswers`, and `accuracy`.

```json
// POST /progress/submit
{
  "userId": "...",
  "puzzleId": "...",
  "categoryId": "...",
  "userAnswer": "Hash map",
  "timeSpent": 24
}
```

---

## 10. Daily quest (`/daily-quest`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/daily-quest` | Today's quest with its puzzles. |
| `GET` | `/daily-quest/status` | Progress counters only. |
| `POST` | `/daily-quest/complete` | Finalize the quest, award bonus XP, update the streak. |

`POST /daily-quest/complete` is idempotent: repeated calls do not duplicate
rewards. It returns `success`, `message`, `bonusXp`, `totalXp`, a `streak`
object (`currentStreak`, `longestStreak`, `lastActivityDate`), and `completedAt`.
`400` if the quest is not fully solved, `404` if no quest exists for today.

Quest payloads carry `id`, `questDate`, `totalQuestions`, `completedQuestions`,
`isCompleted`, `pointsEarned`, `createdAt`, `completedAt`, and `puzzles`. Puzzle
entries in a quest never include the correct answer.

---

## 11. Streaks (`/streaks`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/streaks` | The current user's streak record. |
| `POST` | `/streaks/update` | Recalculate the streak after a daily quest completion. |

The user is taken from the bearer token; `401` when it is missing or invalid.

---

## 12. Analytics (`/analytics`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/analytics/ping` | Module health check. |
| `POST` | `/analytics/track` | Record an event. Throttled to 20 requests per minute. |
| `GET` | `/analytics/funnel/onboarding?start=&end=` | Onboarding funnel over a date range. |
| `GET` | `/analytics/users/retention?start=&end=&granularity=` | Retention curve. Admin role required. |

```json
// POST /analytics/track
{ "eventType": "onboarding_started", "userId": "..." }
// -> { "success": true }
```

`start` and `end` are ISO date strings. Non-admin callers get `403` from
`AnalyticsAdminGuard` on the retention endpoint.

---

## 13. Blockchain (`/blockchain`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/blockchain` | Blockchain module status. |
| `POST` | `/blockchain/wallet/link` | Link a Stellar wallet to the signed-in account. |

```json
{ "walletAddress": "GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A" }
```

---

## 14. Admin: IQ questions (`/admin/iq-questions`)

Requires a bearer token whose user holds the `ADMIN` role; enforced by
`RolesGuard`.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/admin/iq-questions` | Create an IQ question. |
| `DELETE` | `/admin/iq-questions/:id` | Delete an IQ question. |

These handlers are stubs today and return acknowledgement messages.

---

## Quick start with curl

```bash
# 1. Sign in
TOKEN=$(curl -s -X POST http://localhost:3000/auth/signIn \
  -H "Content-Type: application/json" \
  -d '{"email":"player@example.com","password":"Password123!"}' \
  | python -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")

# 2. Call a protected route
curl http://localhost:3000/progress/stats -H "Authorization: Bearer $TOKEN"

# 3. Start a game session
curl -X POST http://localhost:3000/game-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"challengeCount":10,"difficulty":"INTERMEDIATE"}'
```

`backend/src/endpoint.http` and `backend/http/` hold ready-made requests you can
fire from the VS Code REST Client extension.

---

## Keeping this document accurate

Swagger is generated from decorators, so a new endpoint appears at `/api`
automatically once you annotate it with `@ApiOperation` and `@ApiResponse`. When
you add or change a route, update the matching table here in the same pull
request.
