# Git Workflow

## Branch Naming

```
feature/short-description
fix/short-description
refactor/short-description
docs/short-description
chore/short-description
```

## Commit Messages

Format: `type: short description`
- `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`, `test:`
- Vietnamese for commits in this project

Examples:
```
feat: add LP redemption endpoint
fix: auth/me retry logic for Neon cold start
refactor: extract pricing calculator service
docs: add API response conventions rule
```

## Never Do (Hard Rules)

- ❌ **NEVER** `git push --force` to main/master
- ❌ **NEVER** skip hooks (--no-verify)
- ❌ **NEVER** commit `.env`, `.env.local`, credentials, or secrets
- ❌ **NEVER** commit `node_modules/`, `.next/`, `dist/`
- ❌ **NEVER** amend/rebase commits that are already pushed
- ❌ **NEVER** commit directly to main

## Before Committing

```bash
# 1. Run lint + type check
npm run lint
npm run type-check

# 2. Verify no secrets
git status
```

## PR Flow

1. Create branch from `main`
2. Make changes + commit
3. Push + create PR
4. PR must pass CI (lint + type-check + build)
5. Review → Squash and merge
6. Delete branch after merge

## Hotfix Flow

```bash
git checkout main
git pull
git checkout -b fix/urgent-description
# make fix
git push -u origin fix/urgent-description
# create PR → merge ASAP
```
