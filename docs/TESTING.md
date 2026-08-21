# Testing, Linting, and Builds

What the repo can verify today, how to run each check locally, and what CI
enforces on every pull request.

---

## 1. What exists

| Package | Framework | Location | State |
| ------- | --------- | -------- | ----- |
| Backend | Jest + ts-jest | `backend/src/**/*.spec.ts` | Unit and integration specs across auth, health, analytics, quests, streaks, and more. |
| Backend (e2e) | Jest + Supertest | `backend/test/*.e2e-spec.ts` | `app.e2e-spec.ts` and `analytics.e2e-spec.ts`. |
| Frontend | none configured | `frontend/components/ui/__tests__/*.test.tsx` | Test files exist, but the frontend has no test runner in `package.json` yet, so there is no `npm test` for it. |
| Contract | Rust `cargo test` | `contract/src` | Run from `contract/`. |

Wiring a runner into the frontend workspace is an open, welcome contribution.

---

## 2. Backend tests

Run from `backend/`, or from the repo root with `--workspace backend`.

| Command | What it does |
| ------- | ------------ |
| `npm run test` | All `*.spec.ts` files. |
| `npm run test:watch` | Re-run on change. |
| `npm run test:cov` | Coverage report into `backend/coverage/`. |
| `npm run test:e2e` | End-to-end specs via `test/jest-e2e.json`. |
| `npm run test:debug` | Serial run with the Node inspector attached. |

```bash
# From the repo root
npm --workspace backend run test
npm --workspace backend run test:cov
npm --workspace backend run test:e2e
```

Narrow the run while iterating:

```bash
cd backend
npm run test -- health                     # by path or name fragment
npm run test -- src/streak/streaks.service.spec.ts
npm run test -- -t "returns the current streak"   # by test title
```

Jest configuration lives in `backend/jest.config.js`: `ts-jest`, a `node`
environment, `testRegex: '.*\\.spec\\.ts$'`, and a `^src/(.*)$` module alias.
E2E configuration is `backend/test/jest-e2e.json` with
`testRegex: '.e2e-spec.ts$'`.

### Do the tests need PostgreSQL and Redis?

Unit specs mock their dependencies and run without infrastructure. E2E specs
boot the Nest application, so they need whatever the imported modules need:
start PostgreSQL and Redis, and make sure `backend/.env` is populated, before
running `test:e2e`. See [DEVELOPMENT.md](./DEVELOPMENT.md).

### Writing a test

Place the spec next to the code as `<name>.spec.ts` and build the module with
`@nestjs/testing`:

```ts
import { Test } from '@nestjs/testing';
import { StreaksService } from './providers/streaks.service';

describe('StreaksService', () => {
  let service: StreaksService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StreaksService,
        { provide: 'StreakRepository', useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(StreaksService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
```

Guidelines:

- Use relative imports; the `lint-imports` CI job rejects `from "src/..."`.
- Mock repositories and external services rather than reaching for a real database in unit specs.
- Cover the failure paths, not just the happy path. Most bugs found in review are unhandled `null`s and off-by-one boundaries.
- Reserve e2e specs for real request and response contracts.

---

## 3. Contract tests

```bash
cd contract
cargo test --locked
```

CI also runs `cargo fmt --all -- --check` and
`cargo clippy --locked --all-targets --all-features -- -D warnings`, both of
which fail the build on any warning.

---

## 4. Lint

```bash
npm --workspace backend run lint     # ESLint + Prettier, applies --fix
npm --workspace frontend run lint    # eslint-config-next
```

Formatting only, backend:

```bash
npm --workspace backend run format
```

The backend lint script runs with `--fix`, so review the diff it produces before
committing.

### Import rule

Absolute `src/...` imports are rejected by the `lint-imports` job:

```ts
// Not allowed
import X from 'src/components/X';

// Correct
import X from '../../components/X';
```

Check it locally the same way CI does:

```bash
grep -RIn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  -E "^[[:space:]]*(import|export)[^;]*from[[:space:]]+['\"]src/" .
```

No output means you are clean.

---

## 5. Type-check

```bash
npm --workspace backend exec -- tsc --noEmit -p tsconfig.json
npm --workspace frontend exec -- tsc --noEmit -p tsconfig.json
```

---

## 6. Build

```bash
npm --workspace backend run build     # tsc -p tsconfig.build.json -> dist/
npm --workspace frontend run build    # next build
```

Both must pass before a pull request is mergeable.

---

## 7. The full pre-PR check

Run this from the repo root; it mirrors what CI does:

```bash
npm ci

npm --workspace backend run lint
npm --workspace frontend run lint

npm --workspace backend exec -- tsc --noEmit -p tsconfig.json
npm --workspace frontend exec -- tsc --noEmit -p tsconfig.json

npm --workspace backend run test

npm --workspace backend run build
npm --workspace frontend run build

# Only if you touched contract/
cd contract && cargo fmt --all -- --check \
  && cargo clippy --locked --all-targets --all-features -- -D warnings \
  && cargo test --locked
```

---

## 8. What CI runs

Two workflows live in `.github/workflows/`.

### `ci.yml` (push and pull requests to `main` and `develop`)

| Job | Checks |
| --- | ------ |
| `lint-imports` | No absolute `src/...` imports anywhere in the repo. |
| `build` | Node 20.x, `npm ci`, frontend and backend builds. |
| `type-check` | `tsc --noEmit` for both workspaces. |
| `contracts` | `cargo fmt --check`, `clippy -D warnings`, wasm release build, `cargo test`. |

### `ci-cd.yml` (pull requests)

| Job | Checks |
| --- | ------ |
| `validate-pr` | PR title matches Conventional Commits (`feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`) and the description is at least 20 characters. |
| `build-and-deploy` | Runs only after `validate-pr` passes: installs, builds both workspaces, then builds the contract for `wasm32-unknown-unknown`. |

`main` and `develop` are protected: `lint-imports`, `build`, `type-check`, and
`contracts` must be green and the branch must be up to date before merge.

---

## 9. Debugging failures

| Symptom | Likely cause and fix |
| ------- | -------------------- |
| Tests hang and never exit | An open handle, usually a Redis or TypeORM connection left open. Close it in `afterAll`, or run with `--detectOpenHandles`. |
| `Cannot find module 'src/...'` | Use a relative import. The alias exists in Jest config but is banned by `lint-imports`. |
| E2E specs fail on connection errors | PostgreSQL or Redis is not running, or `backend/.env` is incomplete. |
| `Nest can't resolve dependencies of X` | A provider is missing from the testing module. Add it, or supply a mock with `{ provide: TOKEN, useValue: mock }`. |
| Local pass, CI failure | Check your Node version (`node -v`, expected 20.x) and re-run with `npm ci` rather than `npm install`. |
| `clippy` fails but the code compiles | CI runs clippy with `-D warnings`; every warning is an error there. |

More setup-level troubleshooting is in
[DEVELOPMENT.md](./DEVELOPMENT.md#12-common-errors).
