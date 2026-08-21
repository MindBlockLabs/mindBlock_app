# Environment Variables

Every variable used by the Mind Block monorepo, where it is read from, and what
it does. Copy the templates in each section into the matching env file before
starting a service.

| Package  | Env file location     | Loaded by |
| -------- | --------------------- | --------- |
| Backend  | `backend/.env`        | `@nestjs/config` (`ConfigModule.forRoot({ envFilePath: ['.env'] })` in `backend/src/app.module.ts`) |
| Frontend | `frontend/.env.local` | Next.js built-in env loading |
| Contract | shell environment     | Stellar CLI (`stellar`) |

Env files are git-ignored. Never commit real secrets; `backend/.env.example` is
the tracked template.

---

## 1. Backend (`backend/.env`)

### 1.1 Runtime

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `NODE_ENV` | No | `development` | Runtime mode. `npm run start:dev` sets it to `development` for you. Read in `backend/src/config/app.config.ts`. |
| `API_VERSION` | No | unset | Free-form version string surfaced through `appConfig`. |

The HTTP port is currently hard-coded to `3000` in `backend/src/main.ts`
(`await app.listen(3000)`); there is no `PORT` variable yet.

### 1.2 PostgreSQL

The backend supports two mutually exclusive shapes. If `DATABASE_URL` is set it
wins and the discrete variables are ignored (see the TypeORM factory in
`backend/src/app.module.ts`).

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `DATABASE_URL` | Production only | unset | Full connection string, for example `postgres://user:pass@host:5432/mindblock`. Used by managed hosts such as Render. |
| `DATABASE_HOST` | Yes (local) | `localhost` | PostgreSQL host. |
| `DATABASE_PORT` | Yes (local) | `5432` | PostgreSQL port. |
| `DATABASE_USER` | Yes (local) | unset | Database user. |
| `DATABASE_PASSWORD` | Yes (local) | unset | Database password. |
| `DATABASE_NAME` | Yes (local) | unset | Database name, for example `mindblock`. |
| `DATABASE_SYNC` | No | `false` | `true` lets TypeORM auto-create the schema from entities. Convenient locally, never use it against shared or production data. |
| `DATABASE_LOAD` | No | `false` | `true` enables `autoLoadEntities`, so entities registered through `TypeOrmModule.forFeature` are picked up automatically. Keep this on locally. |

> Known quirk: `backend/src/config/database.config.ts` maps those two flags to
> the strings `"true"` and `"false"`, and any non-empty string is truthy. In
> practice TypeORM therefore behaves as if both are enabled whatever you set.
> Treat `DATABASE_SYNC` as always on for local work and point the backend at a
> throwaway database.

### 1.3 TypeORM CLI (migrations only)

`backend/data-source.ts` is a standalone `DataSource` used by the TypeORM CLI.
It reads a different, `DB_`-prefixed set of variables from the ones the Nest
application uses, so set both groups when you intend to run migrations.

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `DB_HOST` | `localhost` | Host for the CLI data source. |
| `DB_PORT` | `5432` | Port for the CLI data source. |
| `DB_USERNAME` | `your_username` | User for the CLI data source. |
| `DB_PASSWORD` | `your_password` | Password for the CLI data source. |
| `DB_NAME` | `your_database` | Database for the CLI data source. |

See [DEVELOPMENT.md](./DEVELOPMENT.md#9-migrations) for how migrations are run
today and the caveats around this file.

### 1.4 Redis

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `REDIS_URL` | Yes | none | Connection URL for `ioredis`, for example `redis://127.0.0.1:6379`. `backend/src/redis/redis.provider.ts` throws `REDIS_URL not defined in environment variables` at boot when it is missing, so the backend will not start without it. |

Redis backs the JWT session and blacklist lookups used by the auth middleware,
plus caching across the app.

### 1.5 Authentication (JWT)

Read in `backend/src/auth/authConfig/jwt.config.ts`.

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `JWT_SECRET` | Yes | none | Signing secret for access and refresh tokens. Use at least 32 characters; generate one with `openssl rand -base64 48`. |
| `JWT_TOKEN_AUDIENCE` | No | `localhost` | `aud` claim. Locally `localhost:3000`. |
| `JWT_TOKEN_ISSUER` | No | `localhost` | `iss` claim. Locally `localhost:3000`. |
| `JWT_ACCESS_TOKEN_TTL` | No | `3600` | Access-token lifetime in seconds. |

### 1.6 Google OAuth

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `GOOGLE_CLIENT_ID` | Google sign-in only | OAuth 2.0 client ID from the Google Cloud console. |
| `GOOGLE_CLIENT_SECRET` | Google sign-in only | OAuth 2.0 client secret. |
| `GOOGLE_CALLBACK_URL` and `GOOGLE_REDIRECT_URI` | Google sign-in only | Redirect URI registered with Google. Both names appear in the codebase; set them to the same value. |

Google sign-in is optional for local development. Leave these unset and use
email/password or Stellar wallet login instead.

### 1.7 Mail (SMTP)

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `MAIL_HOST` | Mail features only | unset | SMTP host, for example `smtp.gmail.com`. |
| `SMTP_PORT` | No | `2525` | SMTP port read by `appConfig`. `backend/.env.example` also lists `MAIL_PORT`, but `SMTP_PORT` is the name the config actually reads. |
| `SMTP_USERNAME` | Mail features only | unset | SMTP username. |
| `SMTP_PASSWORD` | Mail features only | unset | SMTP password or app password. |
| `MAIL_SECURE` | No | `false` | `true` to use TLS on connect. |
| `MAIL_FROM_NAME` | No | unset | Display name on outbound mail. |
| `MAIL_FROM_ADDRESS` | No | unset | From address on outbound mail. |

Password reset (`POST /auth/forgot-password`) is the main mail-dependent flow.
Use a throwaway inbox such as Mailtrap locally.

### 1.8 Operations

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `ADMIN_HEALTH_KEY` | No | `admin-key` | Value expected in the `x-admin-key` header by `GET /health/detailed`. Always override it outside local development. |

### 1.9 Backend template

```dotenv
# Runtime
NODE_ENV=development

# PostgreSQL (local)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=mindblock
DATABASE_SYNC=true
DATABASE_LOAD=true

# TypeORM CLI data source (migrations)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=mindblock

# Redis
REDIS_URL=redis://127.0.0.1:6379

# JWT
JWT_SECRET=change-me-to-at-least-32-random-characters
JWT_TOKEN_AUDIENCE=localhost:3000
JWT_TOKEN_ISSUER=localhost:3000
JWT_ACCESS_TOKEN_TTL=3600

# Google OAuth (optional locally)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google-authentication
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google-authentication

# Mail (optional locally)
MAIL_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=
SMTP_PASSWORD=
MAIL_SECURE=false
MAIL_FROM_NAME=MindBlock
MAIL_FROM_ADDRESS=noreply@mindblock.com

# Operations
ADMIN_HEALTH_KEY=local-admin-key
```

---

## 2. Frontend (`frontend/.env.local`)

Only variables prefixed with `NEXT_PUBLIC_` reach the browser. Anything you put
here is public, so never place secrets in the frontend env file.

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `NEXT_PUBLIC_API_URL` | Yes | unset | Base URL of the backend API. Locally `http://localhost:3000`. In production it points at the deployed backend. |
| `NODE_ENV` | No | set by Next.js | Managed by `next dev` and `next build`; do not set it manually. |

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> The Stellar auth helper in `frontend/lib/stellar/api.ts` still hard-codes
> `http://localhost:3000`. If you move the backend to another host or port, that
> module needs updating too; it does not read `NEXT_PUBLIC_API_URL` yet.

---

## 3. Stellar and Soroban (shell environment)

The contract in `contract/` is built and deployed with the Stellar CLI, which
reads its configuration from CLI flags and your shell rather than from an env
file in this repo. None of this is required to run the backend or frontend
locally.

| Variable | Required | Example | Description |
| -------- | -------- | ------- | ----------- |
| `STELLAR_NETWORK` | Deploys | `testnet` | Network alias used by `stellar contract deploy --network`. |
| `STELLAR_RPC_URL` | Deploys | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint. |
| `STELLAR_NETWORK_PASSPHRASE` | Deploys | `Test SDF Network ; September 2015` | Network passphrase matching the RPC endpoint. |
| `STELLAR_ACCOUNT` | Deploys | `deployer` | Identity alias created with `stellar keys generate`. |
| `STELLAR_SECRET_KEY` | Deploys | `S...` | Raw secret seed, only if you are not using a named identity. Keep it out of the repo and out of shell history. |

Configure a testnet identity once:

```bash
stellar keys generate deployer --network testnet --fund
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

Client-side wallet interaction on the frontend goes through
`@stellar/freighter-api` and the browser extension, so it needs no variables:
the user's wallet supplies the network and the keys.

`shared/config/networks.ts` still holds legacy Starknet endpoints and is not
part of the Stellar configuration path.

---

## 4. Checklist before your first run

- [ ] `backend/.env` exists and contains `REDIS_URL`, `JWT_SECRET`, and the `DATABASE_*` block.
- [ ] PostgreSQL is reachable at `DATABASE_HOST:DATABASE_PORT` and the database named in `DATABASE_NAME` exists.
- [ ] Redis answers `redis-cli ping` with `PONG`.
- [ ] `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:3000`.

Troubleshooting for each of these lives in
[DEVELOPMENT.md](./DEVELOPMENT.md#12-common-errors).
