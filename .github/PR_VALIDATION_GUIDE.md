# PR Validation CI/CD Guide

## What Was Implemented

### 1. CI Workflow Changes (`.github/workflows/ci.yml`)

Added a new `validate-pr` job that runs **only on pull requests** and validates:

- ✅ **PR Title**: Must follow Conventional Commits format with minimum 10 characters
- ✅ **PR Description**: Must contain at least 15 words
- ✅ **Branch Name**: Must follow `feature/*`, `fix/*`, or `docs/*` pattern

The `build` job now depends on `validate-pr`, so validation failures block the build.

### 2. Documentation Updates (`CONTRIBUTING.md`)

Added comprehensive sections covering:
- Branch naming conventions with examples
- PR title format requirements
- PR description requirements with example

---

## Testing the Validation

### ✅ Valid PR Example

**Branch:** `feature/add-user-profile`

**Title:** `feat: add user profile page with avatar upload`

**Description:**
```
This PR implements a new user profile page where users can view and edit their information.

Changes include:
- New ProfilePage component with form validation
- Avatar upload functionality using multipart/form-data
- Integration with existing user API endpoints

Tested manually with different user accounts. Closes #45
```

**Result:** ✅ All validations pass

---

### ❌ Invalid PR Examples

#### Example 1: Bad Title
**Branch:** `feature/profile-page`  
**Title:** `update`  
**Description:** Valid description with more than 15 words explaining the changes made...

**Result:** ❌ Fails - Title doesn't follow convention

---

#### Example 2: Short Description
**Branch:** `feature/profile-page`  
**Title:** `feat: add user profile page`  
**Description:** `Closes #45`

**Result:** ❌ Fails - Description too short (only 2 words)

---

#### Example 3: Bad Branch Name
**Branch:** `my-feature`  
**Title:** `feat: add user profile page`  
**Description:** Valid description with more than 15 words...

**Result:** ❌ Fails - Branch name doesn't follow convention

---

## How to Test Locally

You can test the validation logic locally before pushing:

### Test PR Title
```bash
title="feat: add user authentication system"
if echo "$title" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert): .{10,}$'; then
  echo "✅ Valid"
else
  echo "❌ Invalid"
fi
```

### Test PR Description Word Count
```bash
description="This PR adds OAuth2 authentication support using Google as the provider."
word_count=$(echo "$description" | wc -w)
if [ "$word_count" -ge 15 ]; then
  echo "✅ Valid ($word_count words)"
else
  echo "❌ Too short ($word_count words)"
fi
```

### Test Branch Name
```bash
branch="feature/user-authentication"
if echo "$branch" | grep -qE '^(feature|fix|docs)/[a-z0-9-]+$'; then
  echo "✅ Valid"
else
  echo "❌ Invalid"
fi
```

---

## Validation Rules Summary

| Check | Rule | Example |
|-------|------|---------|
| **Branch Name** | `feature/*`, `fix/*`, or `docs/*` | `feature/add-login` |
| **PR Title** | `<type>: <description (10+ chars)>` | `feat: add OAuth login` |
| **PR Description** | Minimum 15 words | See valid example above |

---

## CI Behavior

- **On Push to main/develop**: Validation is skipped (only runs on PRs)
- **On Pull Request**: Validation runs first, then build/lint/type-check
- **If Validation Fails**: Build job is blocked, PR cannot be merged
- **If Validation Passes**: Normal CI pipeline continues

---

## For Contributors

Before opening a PR, ensure:

1. ✅ Your branch follows the naming convention
2. ✅ Your PR title is descriptive and follows the format
3. ✅ Your PR description explains what, why, and how
4. ✅ You've tested your changes locally

This helps maintainers review faster and keeps the project history clean!
