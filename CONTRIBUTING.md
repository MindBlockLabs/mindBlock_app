# Contributing

## Branch Naming Convention

All feature branches must follow this naming pattern before opening a PR:

- `feature/your-feature-name`
- `fix/short-description`
- `docs/what-you-documented`

**Examples:**
- ✅ `feature/user-authentication`
- ✅ `fix/null-pointer-login`
- ✅ `docs/update-api-reference`
- ❌ `my-branch`
- ❌ `update`

**PRs submitted from branches that do not follow this convention will be rejected by CI.**

---

## Pull Request Title

PR titles must follow the **Conventional Commits** format:

```
<type>: <short description (min 10 characters)>
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

**Examples:**
- ✅ `feat: add OAuth2 login support`
- ✅ `fix: resolve crash on empty cart checkout`
- ✅ `docs: update installation steps for Windows`
- ❌ `Closes #22`
- ❌ `fix: x`
- ❌ `updates`

**The CI pipeline will automatically reject PRs that do not meet this format.**

---

## Pull Request Description

Every PR must include a **meaningful description**. A bare issue reference like `Closes #22` is not acceptable as a full description.

Your PR body should answer:
- **What problem does this PR solve?**
- **How did you solve it?**
- **Any relevant context, screenshots, or testing notes?**

**PRs with fewer than 15 words in the description will be rejected by CI.**

**Example:**
```markdown
This PR adds OAuth2 authentication support using Google as the provider.

Changes include:
- New GoogleAuthController with callback handling
- User creation/lookup on successful OAuth flow
- JWT token generation after authentication

Tested with multiple Google accounts. Closes #22
```

---

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
