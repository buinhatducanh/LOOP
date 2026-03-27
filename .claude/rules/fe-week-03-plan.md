# FE Week 03 Plan — LOOP Solutions

> **Tuần:** Week 03
> **Mục tiêu tuần:** Tích hợp admin core tabs bằng API thật và chuẩn hóa vận hành nội bộ cho luồng xử lý dự án.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal (đo được)

Trong tuần 03, đạt các kết quả bắt buộc:
1. Admin core tabs chạy API thật cho Orders, Services, Portfolio, Members, Clients, Blog.
2. Quyền truy cập tab theo role/department được kiểm tra đúng.
3. Các thao tác CRUD trọng yếu hoạt động ổn định.
4. Có smoke suite cho admin flow quan trọng.

---

## 2) Scope tuần 03

## P0 (bắt buộc)
- [ ] Orders tab: list/detail/update/transition trạng thái.
- [ ] Services tab: CRUD chuẩn.
- [ ] Portfolio tab: CRUD chuẩn + quản lý demo metadata.
- [ ] Members tab: CRUD chuẩn + rank fields cơ bản.
- [ ] Clients tab: list + profile cơ bản.
- [ ] Blog tab: CRUD bài viết.
- [ ] RBAC guard: role/department đúng theo policy.

## P1 (quan trọng)
- [ ] Overview tab lấy KPI thật (order count, revenue summary, active clients).
- [ ] Chuẩn hóa pagination/filter/sort cho tất cả list tab core.
- [ ] Chuẩn hóa audit log cho hành động admin chính.

## P2 (nếu còn thời gian)
- [ ] Bổ sung bulk actions cho 1-2 tab ưu tiên.
- [ ] Cải thiện UX thao tác nhanh (inline edit/selectors).

---

## 3) Phân rã task theo ngày

## Day 1 — Orders + RBAC baseline
- [ ] Kết nối API Orders tab.
- [ ] Kiểm tra role-based visibility/actions.
- [ ] Xử lý state loading/error đúng chuẩn.
- **Output:** Orders tab chạy ổn và đúng quyền.

## Day 2 — Services + Portfolio
- [ ] CRUD Services với API thật.
- [ ] CRUD Portfolio với API thật.
- [ ] Validate trường bắt buộc + thông báo lỗi rõ ràng.
- **Output:** 2 tab sản phẩm vận hành được.

## Day 3 — Members + Clients
- [ ] CRUD Members (phạm vi core fields).
- [ ] Clients list/profile core.
- [ ] Pagination/filter/sort hoạt động.
- **Output:** tab nhân sự + khách hàng ổn định.

## Day 4 — Blog + Overview KPI
- [ ] Blog CRUD tích hợp hoàn chỉnh.
- [ ] Overview lấy KPI thật.
- [ ] Chạy review chéo FE/BE response shape.
- **Output:** admin core gần hoàn chỉnh.

## Day 5 — QA + release hardening
- [ ] Smoke test admin flow.
- [ ] Lint/type-check/build.
- [ ] Tổng hợp issues + kế hoạch tuần 04.
- **Output:** Week 03 release candidate.

---

## 4) API checklist tuần 03

- [ ] `GET/POST/PUT/DELETE /api/admin/orders`
- [ ] `POST|PUT /api/admin/orders/[id]/transition` (nếu có)
- [ ] `GET/POST/PUT/DELETE /api/admin/services`
- [ ] `GET/POST/PUT/DELETE /api/admin/projects`
- [ ] `GET/POST/PUT/DELETE /api/admin/team` hoặc endpoint members tương đương
- [ ] `GET /api/admin/clients` (hoặc endpoint CRM tương đương)
- [ ] `GET/POST/PUT/DELETE /api/admin/blog-posts`
- [ ] `GET /api/admin/dashboard/*` (KPI overview)

---

## 5) QA scenario bắt buộc

1. Admin đúng quyền thấy đúng tab/hành động.
2. CRUD mỗi tab core chạy được và phản ánh đúng dữ liệu sau reload.
3. Filter/sort/pagination không lỗi edge case.
4. Update status order ghi nhận chính xác.
5. Lỗi 401/403/404/500 hiển thị đúng ngữ cảnh UI.

---

## 6) Definition of Done (Week 03)

- [ ] 6 tab admin core dùng API thật.
- [ ] RBAC áp dụng đúng.
- [ ] CRUD core pass smoke test.
- [ ] Lint + type-check + build pass.

---

## 7) Rủi ro & phương án

## Rủi ro
- Quyền chi tiết theo department chưa khớp hoàn toàn FE/BE.
- Dữ liệu legacy gây lỗi mapping trên bảng admin.
- Endpoint admin trả shape không nhất quán giữa module.

## Mitigation
- Khóa permission matrix version cho tuần 03.
- Dùng adapter mapping nhất quán tại service layer FE.
- Audit response shape theo checklist endpoint trước Day 4.

---

## 8) Báo cáo cuối tuần (template)

- **Done:**
- **Not done:**
- **Blockers:**
- **Bug phát hiện:**
- **Tech debt tạo mới:**
- **Plan tuần 04 đề xuất:**

---

## 9) Lệnh kiểm tra trước chốt tuần

```bash
npm run lint
npx tsc --noEmit
npm run build
```
