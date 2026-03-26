# FE Environment Matrix — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa môi trường dev/staging/prod cho FE integration với BE.
> **Cập nhật:** 2026-03-26

---

## 1) Environment definitions

- **Local (dev):** môi trường lập trình cá nhân.
- **Staging:** môi trường kiểm thử trước production.
- **Production:** môi trường người dùng thật.

---

## 2) Endpoint matrix (template)

| Environment | FE URL | API Base URL | Auth Provider | Notes |
|-------------|--------|--------------|---------------|-------|
| local | http://localhost:5173 hoặc FE local | http://localhost:3000 | Local JWT/OAuth test | Dùng cho development |
| staging | <staging-fe-url> | <staging-api-url> | Staging auth config | Dùng cho QA/UAT |
| production | <prod-fe-url> | <prod-api-url> | Production auth config | Dùng cho end users |

---

## 3) Required env vars (FE)

```bash
# API
NEXT_PUBLIC_API_BASE_URL=

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=
NEXT_PUBLIC_ANALYTICS_KEY=

# Feature flags
NEXT_PUBLIC_ENABLE_REALTIME=
NEXT_PUBLIC_ENABLE_EFFECTS=
NEXT_PUBLIC_ENABLE_MEDIA_BOOKING=

# App metadata
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_APP_VERSION=
```

---

## 4) Config rules

1. Mọi biến client-safe phải có prefix `NEXT_PUBLIC_`.
2. Không commit secrets vào repo.
3. Mỗi môi trường phải có file config riêng do CI inject.
4. Feature flags mặc định an toàn (off) với tính năng rủi ro cao.

---

## 5) Promotion rules

- Local -> Staging: chỉ khi pass lint/type-check/build + smoke local.
- Staging -> Production: chỉ khi pass QA sign-off + release checklist.
- Hotfix: theo luồng rút gọn nhưng vẫn bắt buộc rollback plan.

---

## 6) Smoke checks per environment

## Local
- Auth login/me/logout
- Public modules load
- Admin core tabs load

## Staging
- Full critical path smoke
- Contract match checks
- Basic performance sanity checks

## Production
- Post-deploy smoke
- Monitoring error rate/latency
- Confirm no critical regression

---

## 7) Incident fallback by environment

- **Local issue:** dev tự xử lý hoặc pair debug.
- **Staging issue:** fix trước khi promote; không bypass QA.
- **Production issue:** kích hoạt incident playbook + rollback criteria.

---

## 8) Ownership

- FE Lead: FE env config correctness
- BE Lead: API env stability
- DevOps: CI/CD variables + secret management
- QA Lead: staging validation gate
