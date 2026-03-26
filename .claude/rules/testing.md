# Testing

## Test Tooling

- **Unit/Integration:** Vitest (already in package.json)
- **E2E:** Playwright (to add)
- **API Testing:** Vitest + supertest pattern

## What to Test

### Priority 1 — Critical Paths (ALWAYS)
- Authentication flows (login, logout, JWT verification)
- Permission checks (role hierarchy, RBAC)
- API response shapes (consistency)

### Priority 2 — Business Logic
- Price calculations (pricing calculator)
- Order status transitions
- LP award/redeem logic

### Priority 3 — Regression Prevention
- CRUD operations for all major entities
- Pagination logic

## Test File Location

```
tests/
├── api/
│   ├── auth.test.ts
│   ├── orders.test.ts
│   └── tasks.test.ts
├── unit/
│   ├── permissions.test.ts
│   └── pricing.test.ts
└── e2e/
    ├── login.spec.ts
    └── admin-flow.spec.ts
```

## Mocking

- Mock Prisma with `jest.mock("@/lib/prisma")` in unit tests
- Use MSW (Mock Service Worker) for FE API mocking
- Never hit real DB in unit tests

## Naming

- Describe blocks in Vietnamese or English (match project language)
- Test names: describe what it does, not how
- Example: `describe("Authentication")` → `it("rejects request without token")`

## Coverage Target

- Critical paths: 100% coverage
- Business logic: 80%+ coverage
- UI components: visual regression only (Playwright)

## CI Integration

Tests run in CI before merge:
```yaml
- name: Run tests
  run: npm run test
- name: Type check
  run: npm run type-check
```
