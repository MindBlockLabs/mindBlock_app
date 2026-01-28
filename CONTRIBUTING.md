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
npm --workspace backend exec -- tsc --noEmit -p tsconfig.json.
```

## Branch Protection
main and develop require status checks: lint-imports, build, type-check.
Require branches to be up-to-date before merging.
