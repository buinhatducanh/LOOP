# FE API Integration Playbook — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa cách FE tích hợp API thật để giảm mismatch, giảm bug và tăng tốc delivery.
> **Cập nhật:** 2026-03-26

---

## 1) Integration principles

1. Contract-first: không code FE trước khi chốt request/response/status codes.
2. Single API client: mọi call đi qua shared client layer.
3. Typed mapping: luôn map response về typed model dùng trong UI.
4. Graceful failure: mọi màn hình phải có loading/empty/error states.
5. Observability: log đủ để debug nhưng không lộ dữ liệu nhạy cảm.

---

## 2) Suggested FE API structure

```txt
src/
  api/
    client.ts                 # axios/fetch wrapper
    endpoints.ts              # endpoint constants
    errors.ts                 # error mapping
    services/
      auth.service.ts
      services.service.ts
      projects.service.ts
      orders.service.ts
      academy.service.ts
  hooks/
    queries/
    mutations/
  types/
    api/
    domain/
```

---

## 3) Endpoint onboarding checklist (mỗi endpoint)

- [ ] Endpoint path + method đã xác nhận
- [ ] Query params/body schema đã xác nhận
- [ ] Response shape đúng conventions (`data`, `pagination`, `error`)
- [ ] Status code mapping đã xác nhận
- [ ] Auth/permission requirements đã xác nhận
- [ ] Rate limit behavior đã nắm
- [ ] Retry policy đã định nghĩa

---

## 4) Error handling mapping

## HTTP to UI behavior
- **400:** hiển thị lỗi validate cụ thể theo field
- **401:** redirect login hoặc refresh session flow
- **403:** hiển thị no-permission state
- **404:** not-found state + CTA quay lại
- **409:** cảnh báo conflict + gợi ý retry
- **422:** hiển thị lỗi nghiệp vụ có hướng dẫn sửa
- **429:** hiển thị rate-limit message + retry-after
- **500:** generic message + tracking ID (nếu có)

---

## 5) Caching strategy (query layer)

- Danh sách lớn: cache ngắn + pagination.
- Detail pages: cache theo id/slug key.
- Admin mutable data: invalidate theo module khi mutation thành công.
- Tránh polling dày; ưu tiên realtime hoặc manual refresh cho dữ liệu nóng.

---

## 6) Mutation safety

- Dùng optimistic update chỉ khi có rollback rõ.
- Sau mutation, ưu tiên invalidate đúng scope thay vì invalidate toàn cục.
- Tránh double-submit: disable nút submit trong khi pending.

---

## 7) Contract mismatch protocol

Khi FE phát hiện mismatch:
1. Tạo ticket trong kênh contract.
2. Ghi rõ endpoint, expected vs actual payload.
3. Đề xuất workaround tạm thời (adapter) nếu cần unblock.
4. Chốt owner và ETA fix.
5. Cập nhật docs khi mismatch được resolve.

---

## 8) Security notes for FE

- Không lưu token nhạy cảm trong localStorage nếu dùng HttpOnly cookie.
- Không log payload chứa thông tin nhạy cảm.
- Không render trực tiếp raw HTML từ response chưa sanitize.
- Không hiển thị internal stack trace cho user.

---

## 9) Ready-to-ship checklist

- [ ] Endpoint integration pass manual smoke
- [ ] Error states kiểm tra đầy đủ
- [ ] Query/mutation keys chuẩn hóa
- [ ] Không còn mock cho flow đã release
- [ ] Lint + type-check + build pass
