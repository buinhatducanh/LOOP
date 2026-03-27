# FE Week 01 Plan — LOOP Solutions

> **Tuần:** Week 01 (khởi động FE integration)
> **Mục tiêu tuần:** Kết nối FE với BE thật cho flow auth + module public cốt lõi, loại bỏ phụ thuộc mock ở các luồng chính.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal (đo được)

Trong tuần 01, đạt các kết quả bắt buộc:
1. FE gọi được API auth thật (`login`, `me`, `logout`).
2. FE tích hợp API thật cho ít nhất 3 module public: Services, Portfolio, Blog.
3. Chuẩn hóa loading/empty/error states cho các module đã tích hợp.
4. Không merge code nếu chưa pass lint + type-check.

---

## 2) Scope tuần 01

## P0 (bắt buộc)
- [ ] Setup API client thống nhất cho FE (baseURL, timeout, interceptors, error mapping).
- [ ] Auth integration end-to-end:
  - [ ] `POST /api/admin/auth/login`
  - [ ] `GET /api/admin/auth/me`
  - [ ] `POST /api/admin/auth/logout`
- [ ] Public Services integration:
  - [ ] list page dùng API thật
  - [ ] detail page dùng API thật
- [ ] Public Portfolio integration:
  - [ ] list page dùng API thật
  - [ ] detail page dùng API thật
- [ ] Public Blog integration:
  - [ ] list page dùng API thật
  - [ ] detail page dùng API thật
- [ ] Global UI states chuẩn hóa: loading / empty / error.

## P1 (quan trọng)
- [ ] Contact form tích hợp endpoint submit thật.
- [ ] Bổ sung analytics tracking cơ bản cho page view + CTA click.
- [ ] Chuẩn hóa helper xử lý pagination query params.

## P2 (nếu còn thời gian)
- [ ] Refactor module data-fetch theo shared hooks.
- [ ] Tối ưu ảnh lớn ở landing/public pages.

---

## 3) Phân rã task theo ngày

## Day 1 — Foundation
- [ ] Tạo API client layer (shared): request/response/error handling.
- [ ] Tạo auth service + guard utilities FE.
- [ ] Tạo skeleton components cho loading/empty/error.
- **Output:** FE có hạ tầng gọi API và xử lý lỗi đồng nhất.

## Day 2 — Auth integration
- [ ] Login page gọi API thật.
- [ ] Persist session qua HttpOnly cookie.
- [ ] Route guard cho trang protected.
- [ ] Logout flow + clear local UI state.
- **Output:** Auth flow hoạt động trên staging local.

## Day 3 — Services integration
- [ ] Services list + detail dùng API thật.
- [ ] Mapping response data vào UI card/detail.
- [ ] Xử lý empty/error/loading đầy đủ.
- **Output:** Services module không còn dùng mock.

## Day 4 — Portfolio integration
- [ ] Portfolio list + detail dùng API thật.
- [ ] Đồng bộ demo link hiển thị an toàn theo contract.
- [ ] Verify routing params và fallback not-found.
- **Output:** Portfolio module không còn dùng mock.

## Day 5 — Blog + hardening
- [ ] Blog list + detail dùng API thật.
- [ ] Chạy full lint/type-check/build.
- [ ] QA smoke test cho auth + 3 module public.
- [ ] Chốt changelog + known issues.
- **Output:** Week 01 release candidate.

---

## 4) API checklist tuần 01

## Auth
- [ ] `POST /api/admin/auth/login`
- [ ] `GET /api/admin/auth/me`
- [ ] `POST /api/admin/auth/logout`

## Public data
- [ ] `GET /api/v1/services`
- [ ] `GET /api/services/[slug]` hoặc endpoint detail tương đương
- [ ] `GET /api/v1/projects`
- [ ] `GET /api/projects/[slug]` hoặc endpoint detail tương đương
- [ ] `GET /api/blog-posts` (public)
- [ ] `GET /api/blog-posts/[id|slug]` (nếu có)

## Optional
- [ ] `POST /api/contact`
- [ ] `POST /api/analytics/track`

---

## 5) QA scenario bắt buộc

1. **Auth flow:** login thành công, refresh vẫn giữ session, logout đúng.
2. **Services flow:** vào list -> detail -> quay lại list, không lỗi state.
3. **Portfolio flow:** vào list -> detail -> render đủ data.
4. **Blog flow:** vào list -> detail, xử lý not-found đúng chuẩn.
5. **Error flow:** tắt BE tạm thời -> FE hiển thị error state đúng.

---

## 6) Definition of Done (Week 01)

Week 01 chỉ hoàn thành khi tất cả điều kiện dưới đây đạt:
- [ ] Auth E2E hoạt động với API thật.
- [ ] Services/Portfolio/Blog chuyển sang API thật hoàn toàn.
- [ ] Không còn mock data ở 3 module public trên.
- [ ] Lint + type-check + build pass.
- [ ] QA smoke pass và có biên bản ngắn.

---

## 7) Rủi ro & phương án

## Rủi ro
- Endpoint detail không đồng nhất slug/id giữa modules.
- Response shape lệch contract ở một số endpoint cũ.
- Auth cookie behavior khác giữa local và staging.

## Mitigation
- Chốt contract bằng tài liệu trước khi FE coding.
- Tạo adapter layer mapping response trong FE service.
- Test cookie/session ngay từ Day 2 trên đúng domain env.

---

## 8) Báo cáo cuối tuần (template)

- **Done:**
- **Not done:**
- **Blockers:**
- **Bug phát hiện:**
- **Tech debt tạo mới:**
- **Plan tuần 02 đề xuất:**

---

## 9) Lệnh kiểm tra trước chốt tuần

```bash
npm run lint
npx tsc --noEmit
npm run build
```
