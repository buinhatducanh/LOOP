# FE Release Checklist — LOOP Solutions

> **Mục tiêu:** Checklist phát hành chuẩn để giảm lỗi production và tăng tính nhất quán release.
> **Cập nhật:** 2026-03-26

---

## 1) Release metadata

- **Release version:**
- **Release type:** major / minor / patch / hotfix
- **Target environment:** staging / production
- **Release owner:**
- **Approvers (PO/Lead/QA):**
- **Rollback owner:**

---

## 2) Scope confirmation

- [ ] Scope release được freeze
- [ ] Danh sách PR/commit đã chốt
- [ ] Không còn thay đổi ngoài scope (scope creep)
- [ ] Changelog draft đã hoàn thành

---

## 3) Engineering quality gates

- [ ] `npm run lint` pass
- [ ] `npx tsc --noEmit` pass
- [ ] `npm run build` pass
- [ ] Không có secret leak (.env/token/key)
- [ ] Không có TODO/FIXME critical trong phần code mới

---

## 4) Functional gates (flow-based)

## Public
- [ ] Landing/services/portfolio/blog render đúng
- [ ] Error/empty/loading states đúng

## Auth
- [ ] Login/me/logout pass
- [ ] Protected routes guard đúng

## Booking/Order
- [ ] Wizard calculate đúng rule
- [ ] Submit quote/order thành công
- [ ] Order status update đúng lifecycle

## Admin
- [ ] Core tabs hoạt động đúng quyền
- [ ] CRUD chính pass smoke

## Customer portal
- [ ] Dự án/hoá đơn/LP hiển thị đúng
- [ ] Notification/chat baseline ổn định (nếu scope có)

---

## 5) API/Contract gates

- [ ] Endpoint mới tuân thủ response conventions (`{data}`, `{data,pagination}`, `{error,code?}`)
- [ ] HTTP status codes đúng ngữ cảnh
- [ ] Validation và error handling đầy đủ
- [ ] Không có contract mismatch open ở scope release

---

## 6) Database & migration gates (nếu có)

- [ ] Migration file đã review
- [ ] Không sửa migration đã deploy
- [ ] Đã test migration trên môi trường an toàn
- [ ] Có rollback approach cho migration

---

## 7) Performance gates

- [ ] Không tăng bất thường request count ở flow chính
- [ ] KPI baseline không xấu đi đáng kể (LCP/TTFB/P95 API)
- [ ] Trang nặng (dashboard/charts/media) vẫn trong ngưỡng chấp nhận

---

## 8) Security gates

- [ ] Permission checks đúng cho endpoint admin
- [ ] Không lộ dữ liệu nhạy cảm trong response/log
- [ ] Rate limit vẫn hoạt động cho auth/public/admin
- [ ] Không mở endpoint nội bộ ra public ngoài ý muốn

---

## 9) QA sign-off

- [ ] Smoke test pass
- [ ] Regression scope pass
- [ ] Bug blocker = 0
- [ ] Danh sách known issues được chấp nhận
- **QA Approver:**

---

## 10) Release execution steps

1. [ ] Merge branch theo quy trình
2. [ ] Deploy lên staging
3. [ ] Sanity test staging
4. [ ] Approval Go/No-Go
5. [ ] Deploy production
6. [ ] Post-deploy smoke test

---

## 11) Monitoring sau release (0-24h)

- [ ] Theo dõi error rate
- [ ] Theo dõi auth failures
- [ ] Theo dõi API latency P95
- [ ] Theo dõi notification/realtime health (nếu có)
- [ ] Theo dõi báo cáo user issue từ support

---

## 12) Rollback checklist

- [ ] Xác nhận điều kiện rollback (trigger)
- [ ] Thực hiện rollback đúng owner
- [ ] Xác thực hệ thống sau rollback
- [ ] Thông báo stakeholders
- [ ] Mở postmortem ticket

---

## 13) Release closeout

- [ ] Changelog final
- [ ] Cập nhật docs/rules liên quan
- [ ] Tạo action items hậu kiểm
- [ ] Lên kế hoạch patch nếu cần
