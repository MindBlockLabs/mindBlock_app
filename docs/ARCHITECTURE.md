# Architecture

How the Mind Block monorepo is laid out, what each piece is responsible for, and
how a request travels through the system. For the domain entities themselves,
read [CANONICAL_DOMAIN_MODEL.md](./CANONICAL_DOMAIN_MODEL.md), which is the
authoritative specification.

---

## 1. High-level shape

```text
                +---------------------------+
                |  Frontend (Next.js 16)    |
                |  App Router, React 19,    |
                |  Redux Toolkit, Tailwind  |
                +-------------+-------------+
                              | HTTPS / JSON
                              v
                +---------------------------+          +--------------+
                |  Backend (NestJS 11)      |<-------->|  PostgreSQL  |
                |  REST API, JWT auth,      |  TypeORM +--------------+
                |  domain modules, Swagger  |
                +------+-------------+------+          +--------------+
                       |             |<--------------->|    Redis     |
                       |                     ioredis   +--------------+
                       v
            +-----------------------+
            | Stellar / Soroban     |
            | wallet auth, rewards  |
            +-----------------------+
                       ^
                       | Freighter, xBull, Albedo
            +-----------------------+
            | Player's wallet       |
            +-----------------------+
```

The frontend never talks to the database. All scoring, verification, and reward
eligibility are decided by the backend, which is the single authority.

---

## 2. Repository layout

```text
mindBlock_app/
├── backend/          NestJS API (TypeScript)
│   ├── src/
│   │   ├── analytics/          Event tracking, funnels, retention
│   │   ├── auth/               Sign-in, JWT, guest sessions, wallet + Google auth
│   │   ├── blockchain/         Stellar wallet linking and on-chain interaction
│   │   ├── categories/         Puzzle categories
│   │   ├── challenge-attempt/  Per-challenge execution ledger
│   │   ├── common/             Filters, middleware, pagination, shared helpers
│   │   ├── config/             appConfig and databaseConfig registrations
│   │   ├── database/migrations/ TypeORM migrations
│   │   ├── domain/             Canonical enums and domain interfaces
│   │   ├── game-sessions/      Play-through lifecycle
│   │   ├── health/             Liveness, readiness, detailed health
│   │   ├── progress/           Progress history and statistics
│   │   ├── puzzles/            Puzzle content
│   │   ├── quests/             Daily quest system
│   │   ├── redis/              Redis client provider
│   │   ├── rewards/            Reward logic
│   │   ├── roles/              Role decorator and guard
│   │   ├── score/              Scoring helpers
│   │   ├── streak/             Daily streak tracking
│   │   ├── users/              User accounts and profiles
│   │   ├── app.module.ts       Root module and global middleware wiring
│   │   └── main.ts             Bootstrap, Swagger, CORS, graceful shutdown
│   ├── test/                   E2E specs
│   └── data-source.ts          Standalone TypeORM CLI data source
├── frontend/         Next.js App Router client
│   ├── app/                    Routes: auth, dashboard, puzzles, quiz, streak, ...
│   ├── components/, src/components/  UI components
│   ├── features/, lib/features/      Feature-scoped state and logic
│   ├── lib/                    api clients, stellar helpers, analytics, utils
│   ├── hooks/, providers/, styles/
│   └── docs/                   Design tokens and onboarding integration notes
├── contract/         Soroban smart contract (Rust)
├── shared/           Cross-package types and legacy network config
├── docs/             This documentation set
└── .github/workflows/ CI and CI/CD pipelines
```

The root `package.json` declares npm workspaces. `frontend` and `backend` are
the two that exist today; the `contracts` and `middleware` entries in that list
are historical and do not correspond to directories (the Rust crate lives in
`contract/`, singular, and is built by cargo rather than npm).

---

## 3. Backend

### Framework and layering

NestJS 11 with the standard module / controller / provider layering:

- **Module** wires a feature's dependencies (`puzzles.module.ts`).
- **Controller** owns HTTP: routing, DTO binding, Swagger annotations (`puzzles.controller.ts`).
- **Provider / service** holds business logic. Larger features split logic into one provider per use case under `providers/` (see `auth/providers/` and `analytics/providers/`).
- **Entity** is the TypeORM persistence model (`entities/*.entity.ts`).
- **DTO** defines and validates the request and response contract with `class-validator` (`dtos/*.dto.ts`).

Keep HTTP concerns in controllers and business rules in providers; controllers
should stay thin.

### Request lifecycle

```text
HTTP request
  -> CorrelationIdMiddleware   stamps a correlation ID for tracing
  -> GeolocationMiddleware     resolves coarse location from the IP (geoip-lite)
  -> JwtAuthMiddleware         verifies the bearer token, unless the route is public
  -> Guards                    RolesGuard, AnalyticsAdminGuard where declared
  -> ValidationPipe (global)   whitelist + forbidNonWhitelisted + transform
  -> Controller handler
  -> Provider / service        business rules
  -> TypeORM repository        PostgreSQL
  -> Response
  (any throw) -> AllExceptionsFilter -> structured JSON error
```

Public prefixes excluded from `JwtAuthMiddleware` are `/auth/*`, `/api`,
`/docs`, and `/health`. Everything else needs a token. See
[API.md](./API.md#authentication).

### Cross-cutting concerns

| Concern | Implementation |
| ------- | -------------- |
| Configuration | `@nestjs/config` with `registerAs` namespaces: `appConfig`, `database`, `jwt`. Global module, loaded from `backend/.env`. |
| Persistence | TypeORM over PostgreSQL, configured asynchronously in `app.module.ts`. `DATABASE_URL` takes priority over the discrete `DATABASE_*` variables. |
| Caching and sessions | `ioredis` through a single `REDIS_CLIENT` provider in `redis/redis.provider.ts`. |
| Auth | JWT access and refresh tokens, plus Stellar wallet signatures and Google OAuth. |
| Authorization | `@Roles()` decorator with `RolesGuard`; analytics has its own admin guard. |
| Rate limiting | `@nestjs/throttler`, applied per route with `@Throttle`. |
| Scheduled work | `@nestjs/schedule` (`ScheduleModule.forRoot()`), for example daily quest rollovers. |
| Events | `@nestjs/event-emitter`, so side effects such as progress updates, streak evaluation, and reward minting stay decoupled from the request path. |
| Documentation | `@nestjs/swagger`, served at `/api`. |
| Error handling | `AllExceptionsFilter` catches every throwable, not only `HttpException`. |
| Shutdown | `SIGTERM` and `SIGINT` flip health checks to unhealthy, wait for load balancers to drain, then close the app. |

### Domain flow

A typical play-through:

```text
POST /game-sessions            create a GameSession (authenticated or guest)
POST /challenge-attempts       open an attempt for a challenge in that session
POST /challenge-attempts/submit  answer; the backend grades it
  -> emits domain events: progress update, streak evaluation, reward check
PATCH /game-sessions/:id/status  close the session with score and XP
GET  /progress/stats           read back aggregates
```

Guest players get the same flow through a guest session (15 minutes, at most two
hints) and can convert to a real account via `POST /auth/convert-guest` without
losing progress.

---

## 4. Frontend

- **Next.js 16 App Router** with React 19; routes are directories under `frontend/app/`.
- **State**: Redux Toolkit with `react-redux` for app state, TanStack Query for server state.
- **Styling**: Tailwind CSS v4 with `class-variance-authority`, `clsx`, and `tailwind-merge`; design tokens are documented in `frontend/docs/DESIGN_TOKENS.md`.
- **UI primitives**: Radix (avatar, slot, tabs), `lucide-react` icons, `framer-motion` animation, `recharts` charts, `@monaco-editor/react` for coding challenges.
- **Wallets**: `@stellar/freighter-api` plus `stellar-sdk`; wallet helpers live in `frontend/lib/stellar/`.
- **API access**: `frontend/lib/api/` against `NEXT_PUBLIC_API_URL`.

The backend is the source of truth for scoring, so the client renders state and
submits intent rather than computing outcomes.

---

## 5. Smart contract

`contract/` is a Soroban contract built with `soroban-sdk` 23 and deployed to
the Stellar testnet. It backs on-chain rewards for challenge completion.

The release profile is tuned for wasm size (`opt-level = "z"`, LTO, symbols
stripped, `panic = "abort"`). `ed25519-dalek` is pinned to `=2.2.0`; the comment
in `Cargo.toml` explains why, and that pin should not be bumped casually.

Wallet-based authentication does not require the contract: it verifies an
ed25519 signature over a server-issued nonce, entirely off-chain.

---

## 6. Data stores

### PostgreSQL

The system of record: users, puzzles, categories, game sessions, challenge
attempts, progress, quests, streaks, analytics events. Accessed only through
TypeORM repositories.

Schema management is currently in transition: local development leans on
`synchronize`, while `backend/src/database/migrations/` holds explicit
migrations. The caveats are spelled out in
[DEVELOPMENT.md](./DEVELOPMENT.md#9-migrations).

### Redis

Session and token state for the JWT middleware, including blacklisting, plus
caching for hot reads. A missing `REDIS_URL` is fatal at boot by design, so
failures show up immediately rather than at first cache read.

---

## 7. Deployment

| Component | Host | Notes |
| --------- | ---- | ----- |
| Backend | Render | Uses `DATABASE_URL`; `npm run build` then `npm run start:prod`. |
| Frontend | Vercel | `next build`; `NEXT_PUBLIC_API_URL` points at the Render backend. |
| Contract | Stellar testnet | Deployed with the Stellar CLI. |

`/health/ready` is the readiness probe; it reports unhealthy during shutdown so
traffic drains before the process exits.

---

## 8. Conventions that shape the code

1. **Relative imports only.** Absolute `src/...` imports are rejected by CI.
2. **DTOs are the contract.** `forbidNonWhitelisted` means an undeclared field is a `400`, so every accepted field must exist on a DTO.
3. **One provider per use case.** Prefer a new provider over growing a service past its purpose.
4. **Events for side effects.** Progress, streaks, achievements, and minting react to domain events instead of being inlined into request handlers.
5. **Backend decides.** Never move scoring or reward eligibility into the client.
6. **Swagger annotations are mandatory** on new endpoints, so `/api` stays complete.

---

## 9. Where to go next

| Question | Document |
| -------- | -------- |
| How do I run this locally? | [DEVELOPMENT.md](./DEVELOPMENT.md) |
| What configuration does it need? | [ENVIRONMENT.md](./ENVIRONMENT.md) |
| What endpoints exist? | [API.md](./API.md) |
| How do I test my change? | [TESTING.md](./TESTING.md) |
| What are the domain entities? | [CANONICAL_DOMAIN_MODEL.md](./CANONICAL_DOMAIN_MODEL.md) |
| How do I contribute? | [CONTRIBUTING.md](../CONTRIBUTING.md) |
