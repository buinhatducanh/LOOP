# FE Phase F0 Plan — Infrastructure Foundation

> **Tuần:** Phase F0 (Foundation)
> **Mục tiêu:** Hạ tầng kết nối FE ↔ BE: API client layer + Auth flow thật
> **Gốc rễ:** Từ FE mock folder — giữ nguyên 100% giao diện
> **Cập nhật:** 2026-03-28

---

## 1. Sprint Goal (đo được)

Trong Phase F0, đạt các kết quả bắt buộc:
1. API client layer hoạt động: fetch wrapper, auth header, error mapping.
2. Auth flow real end-to-end: login → JWT → auth guard → Navbar user state.
3. FE mock data được giữ lại làm fallback khi BE offline.
4. Không thay đổi 1 pixel giao diện nào.
5. Lint + type-check + build pass.

---

## 2. Scope Phase F0

### P0 (bắt buộc)

#### A) API Client Layer
- [ ] Tạo `src/api/client.ts`: fetch wrapper với:
  - Base URL từ env (`VITE_API_BASE_URL`)
  - Auth header tự động (Authorization: Bearer token)
  - Error mapping: HTTP status → UI behavior
  - Timeout handling
  - Retry logic cho transient errors

#### B) Auth Service
- [ ] `src/api/auth.service.ts`: login, logout, me
- [ ] `src/api/adminClient.ts`: admin API client với auth

#### C) Auth Store Integration
- [ ] Thay `DEMO_USERS.login()` → gọi `POST /api/admin/auth/login`
- [ ] Lưu JWT vào localStorage
- [ ] `GET /api/admin/auth/me` → set user state
- [ ] `POST /api/admin/auth/logout` → clear token + state

#### D) Auth Guards
- [ ] Bảo vệ `/admin` — redirect `/dang-nhap` nếu chưa auth
- [ ] Bảo vệ `/khach-hang` — redirect `/dang-nhap` nếu chưa auth
- [ ] Role-based guard: `admin`, `manager`, `staff`, `client` → hiển thị tabs phù hợp

#### E) Fallback Safe
- [ ] Giữ nguyên `DEMO_USERS` trong authStore — làm fallback khi BE offline
- [ ] Giữ nguyên `INIT_QUESTS`, `INIT_EVENTS` trong authStore — fallback data
- [ ] Giữ nguyên `INIT_ORDERS`, `INIT_SERVICES`, `INIT_PORTFOLIO`, `INIT_EFFECTS` trong loopStore

### P1 (quan trọng)

#### F) API Services (bước đầu)
- [ ] `src/api/services.service.ts`: getServices(), getServiceById()
- [ ] `src/api/team.service.ts`: getMembers()
- [ ] `src/api/projects.service.ts`: getProjects()

#### G) Navbar Integration
- [ ] Navbar: thay demo user → real user từ `/api/admin/auth/me`
- [ ] LP badge: lấy LP balance từ `/api/customer/lp`
- [ ] Role switcher demo → giữ UI nhưng dùng real role

---

## 3. Chi tiết từng bước

### Step 1 — API Client (`src/api/client.ts`)

```typescript
// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('loop_token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('loop_token');
      window.location.href = '/dang-nhap';
    }
    throw new Error(await res.text());
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

### Step 2 — Auth Service

```typescript
// src/api/auth.service.ts
import { api } from './client';
import { AuthUser } from '../store/authStore';

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/admin/auth/login', { email, password }),

  logout: () => api.post<void>('/admin/auth/logout', {}),

  me: () => api.get<{ user: AuthUser }>('/admin/auth/me'),
};
```

### Step 3 — Auth Store Update

Cập nhật `authStore.ts` để dùng `authService`:
- `login()`: gọi `authService.login()`, lưu token, set user
- `logout()`: gọi `authService.logout()`, xóa token, clear user
- `loginAs()`: giữ nguyên cho demo mode (fallback)

### Step 4 — Auth Guard (React Router)

```typescript
// Trong routes.ts, thêm loader hoặc wrapper:
// ProtectedRoute: check localStorage token → call /me → set user
// Redirect /dang-nhap nếu không authenticated
```

### Step 5 — Integration Navbar

- `Navbar.tsx` đã dùng `useAuthStore()` — chỉ cần đảm bảo user data từ `/me` match `AuthUser` interface
- LP badge: `GET /api/customer/lp` → hiển thị số dư

---

## 4. API Checklist Phase F0

### Auth
- [ ] `POST /api/admin/auth/login` → FE: AuthPage login form
- [ ] `GET /api/admin/auth/me` → FE: Navbar user, auth guards
- [ ] `POST /api/admin/auth/logout` → FE: logout flow

### Verify BE endpoint behavior
- [ ] Check: login trả về JWT token đúng format
- [ ] Check: `/me` trả về user có field: id, name, email, role, department, rank, lpBalance, level
- [ ] Check: HTTP 401 → redirect login

---

## 5. Giao diện cần thay đổi

**Tuyệt đối KHÔNG thay đổi:**
- Bất kỳ component JSX nào
- Bất kỳ style nào (Tailwind, CSS variables)
- Bất kỳ animation nào
- Bất kỳ page routing nào

**Chỉ thay đổi data source:**
- `authStore.ts`: login/logout → API thật (giữ DEMO_USERS fallback)
- `Navbar.tsx`: demo user badge → real user từ `/me`
- Data fetching: hard-coded arrays → API calls

---

## 6. Definition of Done (Phase F0)

- [ ] FE gọi được `POST /api/admin/auth/login` và nhận JWT
- [ ] FE persist token trong localStorage
- [ ] FE call `/api/admin/auth/me` → hiển thị user trong Navbar
- [ ] `/admin` redirect về `/dang-nhap` khi chưa auth
- [ ] `/khach-hang` redirect về `/dang-nhap` khi chưa auth
- [ ] Demo users vẫn hoạt động khi BE offline (fallback)
- [ ] Không thay đổi giao diện
- [ ] Lint + type-check + build pass

---

## 7. Rủi ro & Phương án

| Rủi ro | Mitigation |
|---|---|
| BE `/login` response không match `AuthUser` interface | Map response → `AuthUser` trong service layer |
| JWT storage strategy (HttpOnly cookie vs localStorage) | Dùng localStorage cho FE mock; note để BE dùng HttpOnly cookie |
| BE chưa có `/me` hoặc `/logout` | Tạo minimal endpoints nếu thiếu |
| Mock data leak vào production | Flag `VITE_USE_MOCK=false` → API only |

---

## 8. Commands

```bash
cd d:/LOOP_COMPANY/LOOP/FE
npm run dev          # port 5173/5174

# Type check
npx tsc --noEmit

# Lint
npx eslint src/
```
