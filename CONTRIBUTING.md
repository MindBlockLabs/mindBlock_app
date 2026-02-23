# Contributing

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

Issue/PR: https://github.com/MindBlockLabs/mindBlock_app/pull/0000 (placeholder)

**MUST RUN** Local check to before submitting a pr:
```bash
npm ci
npm --workspace frontend run build
npm --workspace backend run build

npm --workspace frontend run lint
npm --workspace backend run lint

npm --workspace frontend exec -- tsc --noEmit -p tsconfig.json
npm --workspace backend exec -- tsc --noEmit -p tsconfig.json
```

## Branch Protection
main and develop require status checks: lint-imports, build, type-check.
Require branches to be up-to-date before merging.


## Pull Request Standards

To maintain a clean commit history and make reviews efficient, all pull requests must meet the following requirements:

### Branching Convention
- Use descriptive branch names:
  - `feature/your-feature-name`
  - `fix/issue-number`
  - `chore/tooling-update`
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
- Avoid minimal descriptions like only writing `Closes #22`.

### CI/CD Enforcement
- The CI pipeline will automatically reject PRs that:
  - Have non-compliant titles (e.g., `update`, `fix bug`).
  - Have descriptions shorter than 20 characters or missing context.
- The `build-and-deploy` job depends on PR validation, so failing validation will block merges.

---

By following these standards, contributors ensure their PRs are clear, maintainable, and easy to review.
