# Contributing

Thanks for contributing to Mind Block. This document is the process; the
technical setup lives in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Before you start

| I need to... | Read |
| ------------ | ---- |
| Set the project up locally | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| Know which environment variables to set | [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) |
| Understand the codebase layout | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Call or extend the API | [docs/API.md](docs/API.md) |
| Run tests, lint, and builds | [docs/TESTING.md](docs/TESTING.md) |

## Contributor workflow

1. **Find an issue.** Pick an open issue and comment that you are taking it, or open one describing the problem before writing code. `good first issue` is the easiest entry point.
2. **Fork and clone.** Work on a fork; branch protection blocks direct pushes to `main` and `develop`.
3. **Set up.** Follow [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): Node 20.x, npm, PostgreSQL, Redis, env files.
4. **Branch from `main`.** Use the naming convention below.
5. **Make the change.** Keep it scoped to the issue; unrelated refactors make review slower and merges riskier.
6. **Add tests.** New behaviour needs a spec. See [docs/TESTING.md](docs/TESTING.md).
7. **Run the local checks.** The full list is below and must pass before you push.
8. **Commit** using Conventional Commits.
9. **Open a PR** against `main` with a full description, and link the issue with `closes #<number>`.
10. **Respond to review** with follow-up commits, keeping the branch up to date with `main`.

## Import Guidelines

Rule: Always use relative imports.

Bad:
```ts
import X from "src/components/X";
```

Good:
```ts
import X from "../../components/X";
```

CI will reject PRs containing src/* imports.

## Local checks

**MUST RUN** before submitting a PR:

```bash
npm ci
npm --workspace frontend run build
npm --workspace backend run build

npm --workspace frontend run lint
npm --workspace backend run lint

npm --workspace frontend exec -- tsc --noEmit -p tsconfig.json
npm --workspace backend exec -- tsc --noEmit -p tsconfig.json

npm --workspace backend run test
```

These mirror the CI jobs, so a clean local run means a green pipeline. Details
and troubleshooting are in [docs/TESTING.md](docs/TESTING.md).

## Contract Development

### Prerequisites
Install the following tools before working on contracts:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32-unknown-unknown target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli
```

**MUST RUN** Local checks from inside `contract/` before submitting a PR:

```bash
cd contract/

# Check formatting
cargo fmt --all -- --check

# Run clippy the way CI does
cargo clippy --locked --all-targets --all-features -- -D warnings

# Build the contract
stellar contract build

# Run tests
cargo test --locked
```

The crate directory is `contract/` (singular).

## Branch Protection
main and develop require status checks: lint-imports, build, type-check, contracts.
Require branches to be up-to-date before merging.

## Pull Request Standards

To maintain a clean commit history and make reviews efficient, all pull requests must meet the following requirements:

### Branching Convention
- Use descriptive branch names:
  - `feature/your-feature-name`
  - `fix/issue-number`
  - `chore/tooling-update`
  - `docs/what-you-documented`
- Avoid vague names like `update` or `patch`.

### PR Title
- Must follow **Conventional Commits** style:
  - Format: `<type>(optional-scope): short description (#issue-number)`
  - Allowed types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`
- Examples:
  - `fix(streaks): use user timezone for date strings (#241)`
  - `feat(auth): add refresh token support (#250)`
  - `docs(contributing): clarify PR standards (#234)`

### PR Description
- Must provide enough context for maintainers to understand the change without reading every line of code.
- Minimum requirements:
  - **Problem**: What issue does this PR solve?
  - **Solution**: How was it solved?
  - **Acceptance Criteria**: What conditions prove the fix works?
  - **Testing Notes**: How was it tested?
- Link the issue with `closes #<issue-number>`.
- Avoid minimal descriptions like only writing `Closes #22`.

### CI/CD Enforcement
- The CI pipeline will automatically reject PRs that:
  - Have non-compliant titles (e.g., `update`, `fix bug`).
  - Have descriptions shorter than 20 characters or missing context.
- The `build-and-deploy` job depends on PR validation, so failing validation will block merges.

## Code Standards

- **TypeScript everywhere** in `backend/` and `frontend/`; avoid `any` where a real type is expressible.
- **Backend layering**: HTTP concerns in controllers, business rules in providers, persistence in entities and repositories. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **DTOs are the contract**: the global `ValidationPipe` runs with `forbidNonWhitelisted`, so any accepted field must be declared and validated on a DTO.
- **Document new endpoints** with `@ApiOperation` and `@ApiResponse` so Swagger at `/api` stays complete, and update the matching table in [docs/API.md](docs/API.md) in the same PR.
- **New environment variables** must be added to `backend/.env.example` and documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).
- **Never commit secrets.** Env files are git-ignored; keep them that way.
- **Formatting** is handled by Prettier and ESLint. Run `npm --workspace backend run format` rather than hand-formatting.

## Documentation changes

Docs are part of the product. If your change alters setup steps, configuration,
endpoints, or commands, update the affected file under `docs/` in the same pull
request. The acceptance bar is simple: a new contributor should be able to go
from clone to a running stack with passing tests using only what is committed
here.

---

By following these standards, contributors ensure their PRs are clear, maintainable, and easy to review.
