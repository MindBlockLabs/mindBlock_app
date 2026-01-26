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

Local check:
```
grep -r "from ['\"]src/" --include="*.ts" --include="*.tsx" .
```

## Branch Protection
main and develop require status checks: lint-imports, build, type-check.
Require branches to be up-to-date before merging.
