# API Docs Tooling

> **Updated:** 2026-03-26 | **Status:** ✅ Starter setup complete

---

## Tooling Choice

Recommended stack:

1. **OpenAPI 3.0 spec** (`openapi.yaml`) as source of truth
2. **Scalar** for interactive docs UI (best DX, modern UI)
3. Optional fallback: Swagger UI

Why Scalar:
- Cleaner UI than Swagger
- Better search and endpoint navigation
- Easy local preview and static hosting

---

## What is now in repo

- `openapi.yaml` — initial API spec for core endpoints (public, auth, admin, webhooks)
- This file (`docs/DOCS-TOOLING.md`) — setup and workflow

---

## Local Preview Options

### Option A — Scalar (recommended)

```bash
# install (if not already)
npm i -D @scalar/cli

# serve the OpenAPI file locally
npx @scalar/cli@latest preview ./openapi.yaml --port 5050

# open
http://localhost:5050
```

### Option B — Swagger UI via Redocly

```bash
npm i -D @redocly/cli
npx @redocly/cli preview-docs ./openapi.yaml
```

---

## Validation in CI

Add to CI workflow:

```yaml
- name: Validate OpenAPI spec
  run: npx @redocly/cli lint ./openapi.yaml
```

---

## Maintenance Workflow

When API changes:

1. Update route handler code first
2. Update `docs/API-CONTRACT.md`
3. Update `openapi.yaml` paths/schemas
4. Run OpenAPI lint
5. Preview in Scalar

---

## Suggested Next Upgrade

Current `openapi.yaml` is starter-level and covers high-value routes.
To reach full parity (150+ endpoints):

- Add all `/api/admin/*` endpoints incrementally by module:
  - auth
  - content
  - sales
  - PM
  - system
  - edu
- Reuse component schemas (Order, Task, User, etc.)
- Add examples for each endpoint
- Add security schemes:
  - cookie auth for admin routes
  - signature headers for webhook routes

---

## Security Schemes (planned)

```yaml
components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: auth-token

security:
  - cookieAuth: []
```

Use per-path override where route is public.

---

## Developer Commands Cheat Sheet

```bash
# Validate spec
npx @redocly/cli lint ./openapi.yaml

# Preview with Scalar
npx @scalar/cli@latest preview ./openapi.yaml --port 5050

# Generate static docs (optional)
npx @redocly/cli build-docs ./openapi.yaml --output ./docs/api-reference.html
```
