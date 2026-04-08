# Automation Testing Conventions

> **Version**: 1.0.0 · Updated: 2026-04-08
> **Scope**: Playwright E2E + Vitest API/Integration tests

---

## Test Structure

```
tests/
├── e2e/          # Playwright E2E (full browser, real server)
├── api/           # Vitest API tests (HTTP calls to dev server)
└── integration/    # Vitest integration tests (direct service calls)
```

## Naming Conventions

| File | Convention | Example |
|------|-----------|---------|
| E2E spec | `*.spec.ts` | `handover.spec.ts` |
| API test | `*.test.ts` | `task-kanban.test.ts` |
| Integration | `*.test.ts` | `full-order-lifecycle.test.ts` |
| Helper | `*.fixture.ts` | `auth.fixture.ts` |

## Test Data Management

- Each test creates its own data via API → unique identifiers (cuid)
- Use `beforeEach` to clean up: delete records created in test
- Never share test data between tests (no shared fixtures)
- Use `test.describe.serial` for multi-step flows

## Playwright Best Practices

- Use `data-testid` attributes on interactive elements (buttons, inputs, modals)
- Avoid `page.waitForSelector` — use `page.waitForResponse()` or `page.waitForURL()`
- Mock external APIs (Google OAuth, email) via `page.route()`
- Each actor (customer, admin, designer) gets a separate `page` context

## API Test Best Practices

- Start dev server: `npm run dev` in background → `waitOn http://localhost:3000`
- Use Bearer token from `auth.fixture.ts`
- Test both success AND failure paths (401, 403, 404, 400)
- Validate response shape matches API conventions

## Running Tests

```bash
# Unit + API tests
npm run test:run

# E2E (requires dev server)
npm run dev &
npx wait-on http://localhost:3000
npm run e2e

# Coverage
npm run test:coverage
```

## CI Integration

E2E runs in CI after `be-build` step:
- `npx playwright install --with-deps chromium`
- `npm run dev &` + `waitOn http://localhost:3000`
- `npm run e2e`
- Upload Playwright report on failure

## New API Tests Required (v6 — 2026-04-08)

| File | Coverage | Priority |
|------|----------|---------|
| `tests/api/task-kanban.test.ts` | CRUD + transitions + LP award | P0 |
| `tests/api/project-members.test.ts` | Assign/remove members | P1 |
| `tests/api/handover.test.ts` | Create/update handover package | P1 |
| `tests/api/notifications.test.ts` | Create + list + mark-read | P1 |
| `tests/api/figma-demo-client.test.ts` | Token approval flow | P1 |
| `tests/api/sse-stream.test.ts` | SSE endpoint | P2 |

## New E2E Specs Required (v6 — 2026-04-08)

| File | Flow | Priority |
|------|------|---------|
| `tests/e2e/handover.spec.ts` | Full 18-step E2E | P0 |
| `tests/e2e/kanban-task-lifecycle.spec.ts` | PM creates → dev → QA → LP | P1 |
| `tests/e2e/pm-project-flow.spec.ts` | Assign team → board | P1 |
| `tests/e2e/figma-demo-approval.spec.ts` | Designer sends → client approves | P1 |
| `tests/e2e/domain-hosting.spec.ts` | Purchase → eKYC → config | P2 |
