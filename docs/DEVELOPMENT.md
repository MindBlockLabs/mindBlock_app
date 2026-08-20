# Development Guide

Everything needed to go from a fresh clone to a running stack with passing
tests. Follow the sections in order the first time.

```text
clone -> install -> configure -> start PostgreSQL -> start Redis -> run backend -> run frontend -> run tests
```

---

## 1. Prerequisites

| Tool | Version | Why |
| ---- | ------- | --- |
| Node.js | 20.x LTS (>= 20.9.0) | CI pins `node-version: 20.x`; Next.js 16 requires >= 20.9. Node 18 and below will fail the frontend build. |
| npm | 10.x (ships with Node 20) | The repo is an npm workspaces monorepo with a committed `package-lock.json`. Do not use yarn, pnpm, or bun: they would produce a second lockfile and break `npm ci` in CI. |
| PostgreSQL | 14 or newer | Primary datastore, accessed through TypeORM. |
| Redis | 6 or newer | Sessions, JWT blacklisting, caching. |
| Git | any recent | Version control. |
| Rust toolchain + `wasm32-unknown-unknown` | stable | Only for `contract/`. |
| Stellar CLI | latest | Only for building and deploying the Soroban contract. |

Check your versions:

```bash
node -v   # v20.x
npm -v    # 10.x
psql --version
redis-server --version
```

If you juggle several Node versions, use `nvm`:

```bash
nvm install 20
nvm use 20
```

---

## 2. Clone and install

```bash
git clone https://github.com/MindBlockLabs/mindBlock_app.git
cd mindBlock_app
npm ci
```

`npm ci` installs every workspace (`frontend`, `backend`, and the rest) from the
lockfile in a single pass. Use it rather than `npm install` unless you are
deliberately adding or upgrading a dependency.

Working inside one package only? You can still install just that package:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Adding a dependency to a workspace from the repo root:

```bash
npm install <package> --workspace backend
npm install <package> --workspace frontend
```

Commit the resulting `package-lock.json` change with your PR.

---

## 3. Configure environment files

```bash
cp backend/.env.example backend/.env
printf 'NEXT_PUBLIC_API_URL=http://localhost:3000\n' > frontend/.env.local
```

Then open `backend/.env` and fill in at minimum `REDIS_URL`, `JWT_SECRET`, and
the `DATABASE_*` block. Every variable is documented in
[ENVIRONMENT.md](./ENVIRONMENT.md).

---

## 4. Start PostgreSQL

### Option A: Docker (fastest)

```bash
docker run --name mindblock-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mindblock \
  -p 5432:5432 -d postgres:16
```

### Option B: Local install

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16

# Ubuntu / Debian
sudo apt install postgresql && sudo systemctl start postgresql

# Windows: install from https://www.postgresql.org/download/windows/
```

Create the database once the server is up:

```bash
createdb mindblock
# or: psql -U postgres -c "CREATE DATABASE mindblock;"
```

Verify:

```bash
psql -U postgres -d mindblock -c "SELECT 1;"
```

The values you use here must match `DATABASE_USER`, `DATABASE_PASSWORD`,
`DATABASE_NAME`, `DATABASE_HOST`, and `DATABASE_PORT` in `backend/.env`.

---

## 5. Start Redis

### Option A: Docker

```bash
docker run --name mindblock-redis -p 6379:6379 -d redis:7
```

### Option B: Local install

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu / Debian
sudo apt install redis-server && sudo systemctl start redis-server

# Windows: use WSL2, Docker, or Memurai
```

Verify:

```bash
redis-cli ping   # -> PONG
```

The backend refuses to boot without a reachable `REDIS_URL`.

---

## 6. Run the backend

```bash
cd backend
npm run start:dev
```

- API: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/api>
- Health: <http://localhost:3000/health>

With `DATABASE_SYNC` enabled, TypeORM creates the schema from the entities on
first boot, so an empty database is fine.

Other backend scripts:

| Command | What it does |
| ------- | ------------ |
| `npm run start` | Start once, no watcher. |
| `npm run start:dev` | Watch mode, `NODE_ENV=development`. |
| `npm run start:debug` | Watch mode with the Node inspector attached. |
| `npm run start:prod` | Run the compiled output in `dist/`. Requires `npm run build` first. |
| `npm run build` | Compile TypeScript via `tsconfig.build.json`. |
| `npm run lint` | ESLint over `src`, `apps`, `libs`, `test` with `--fix`. |
| `npm run format` | Prettier over `src` and `test`. |

---

## 7. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

The Next.js app starts on <http://localhost:3001> when 3000 is already taken by
the backend; watch the terminal output for the URL it actually chose, and make
sure `NEXT_PUBLIC_API_URL` still points at the backend.

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Next.js dev server with Turbopack. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint via `eslint-config-next`. |

### Running both at once

From the repo root:

```bash
npm run dev:backend    # backend only
npm run dev:frontend   # frontend only
```

`npm run dev` is meant to start both at once through `concurrently`, but
`concurrently` is not declared in any `package.json` and is absent from the
lockfile, so the script fails on a clean install. Run the two commands above in
separate terminals, or add the dependency yourself with `npm i -D concurrently`.
Declaring it at the root is a small, welcome PR.

---

## 8. Contract (optional)

Only needed when you are changing Soroban code in `contract/`.

```bash
# One-time toolchain setup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cd contract
cargo fmt --all -- --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo build --locked --target wasm32-unknown-unknown --release
cargo test --locked
```

`stellar contract build` produces the same wasm artifact through the Stellar CLI
wrapper. Deploy targets and identities are covered in
[ENVIRONMENT.md](./ENVIRONMENT.md#3-stellar-and-soroban-shell-environment).

Note the directory is `contract/` (singular). Older docs referred to
`contracts/`.

---

## 9. Migrations

Schema changes live in `backend/src/database/migrations/`, named
`<timestamp>-<Description>.ts`.

Local development currently relies on TypeORM `synchronize` rather than running
migrations, so a normal contributor flow does not need them. When you do need
the CLI, the backend exposes it as a script:

```bash
cd backend
npm run typeorm -- migration:show     -d data-source.ts
npm run typeorm -- migration:run      -d data-source.ts
npm run typeorm -- migration:revert   -d data-source.ts
```

Generate a new migration after changing entities:

```bash
npm run typeorm -- migration:generate src/database/migrations/AddSomething -d data-source.ts
```

Caveats worth knowing before you touch this area:

- `backend/data-source.ts` reads the `DB_*` variables, not the `DATABASE_*` ones the app uses. Set both (see [ENVIRONMENT.md](./ENVIRONMENT.md#13-typeorm-cli-migrations-only)).
- Its `migrations` glob resolves to `backend/migrations/`, while the migration files actually live in `backend/src/database/migrations/`. Pass the path explicitly, or fix the data source, when running the CLI.
- Its `entities` glob is `__dirname + '**/*.entity{.ts,.js}'`, which is missing a path separator and matches nothing.
- It sets `synchronize: true`; do not point it at a database whose contents you care about.

Aligning that file with the app configuration is a welcome standalone PR.

---

## 10. Seed data

`backend/src/seed.ts` boots a Nest application context and exits. It is a
scaffold with no seeders wired into it yet, so there is no seed command in
`package.json`. Run it directly if you are extending it:

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/seed.ts
```

`backend/scripts/create-iq-attempts-table.sql` is a one-off SQL helper you can
apply with `psql -U postgres -d mindblock -f backend/scripts/create-iq-attempts-table.sql`.

Until seeders exist, create content through the API: `POST /categories`, then
`POST /puzzles`. See [API.md](./API.md).

---

## 11. Tests, lint, and build

Full detail lives in [TESTING.md](./TESTING.md). The short version:

```bash
# Tests (backend only for now)
npm --workspace backend run test
npm --workspace backend run test:cov
npm --workspace backend run test:e2e

# Lint
npm --workspace backend run lint
npm --workspace frontend run lint

# Type-check
npm --workspace backend exec -- tsc --noEmit -p tsconfig.json
npm --workspace frontend exec -- tsc --noEmit -p tsconfig.json

# Build
npm --workspace backend run build
npm --workspace frontend run build
```

Run all of these before opening a pull request; CI enforces the same set.

---

## 12. Common errors

### `REDIS_URL not defined in environment variables`

Redis config is missing. Add `REDIS_URL=redis://127.0.0.1:6379` to
`backend/.env` and restart. The backend throws this during boot, before it
listens.

### `ECONNREFUSED 127.0.0.1:6379`

Redis is not running. Start it (`brew services start redis`,
`sudo systemctl start redis-server`, or the Docker command in section 5) and
confirm with `redis-cli ping`.

### `ECONNREFUSED 127.0.0.1:5432` or `password authentication failed for user`

PostgreSQL is not running, or the credentials in `backend/.env` do not match the
server. Verify with
`psql -U "$DATABASE_USER" -h "$DATABASE_HOST" -d "$DATABASE_NAME" -c "SELECT 1;"`.

### `database "mindblock" does not exist`

Create it: `createdb mindblock`.

### `EADDRINUSE: address already in use :::3000`

Something already holds port 3000, usually a previous backend process or the
frontend dev server.

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ }
```

### `401 Unauthorized` on every backend request

Most routes sit behind the JWT middleware. Only `/auth/*`, `/api`, `/docs`, and
`/health` are public. Sign in first and send
`Authorization: Bearer <accessToken>`.

### `400 Bad Request` with `property ... should not exist`

The global `ValidationPipe` runs with `forbidNonWhitelisted: true`, so any field
not declared on the DTO is rejected. Remove the extra field or add it to the DTO.

### `ERROR: Absolute imports from "src/" are not allowed`

The `lint-imports` CI job rejects `from "src/..."`. Use relative imports
(`../../components/X`). See [CONTRIBUTING.md](../CONTRIBUTING.md).

### Frontend build fails with an unsupported Node version

Next.js 16 needs Node >= 20.9. Run `nvm use 20`, delete `frontend/.next`, and
rebuild.

### `npm ci` fails after switching branches

The lockfile changed. Remove stale installs and retry:

```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm ci
```

### Contract build fails resolving `ed25519-dalek`

`contract/Cargo.toml` pins `ed25519-dalek = "=2.2.0"` on purpose. Build with
`--locked` and do not upgrade that pin without reading the comment above it.

---

## 13. Contributor workflow

1. Pick or open an issue and comment that you are taking it.
2. Fork, then branch from `main`: `feature/...`, `fix/<issue-number>`, `chore/...`, or `docs/...`.
3. Make the change, keeping it scoped to the issue.
4. Run the tests, lint, type-check, and build commands from section 11.
5. Commit using Conventional Commits: `feat(auth): add refresh token rotation`.
6. Push and open a pull request with problem, solution, acceptance criteria, and testing notes, and link the issue with `closes #<number>`.
7. Address review feedback with follow-up commits; keep the branch up to date with `main`.

The full standard, including PR title validation and branch protection, is in
[CONTRIBUTING.md](../CONTRIBUTING.md).
