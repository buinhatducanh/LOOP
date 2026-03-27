# FE Week 06 Plan — LOOP Solutions

> **Tuần:** Week 06
> **Mục tiêu tuần:** Khởi tạo realtime operations (chat/notifications) cho customer-admin collaboration.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Chat theo order hoạt động realtime mức baseline.
2. Notification center nhận sự kiện quan trọng theo lifecycle.
3. Customer/Admin portal hiển thị đồng bộ trạng thái và tin nhắn mới.

---

## 2) Scope tuần 06

## P0
- [ ] Order chat API integration (send/get messages).
- [ ] Realtime channel baseline (SSE/WebSocket tùy implementation).
- [ ] Notification center: unread/read/delete cơ bản.
- [ ] Customer portal support tab đồng bộ message mới.

## P1
- [ ] Typing/online indicator baseline.
- [ ] Retry strategy khi realtime disconnect.

## P2
- [ ] File attachment chat (MVP).

---

## 3) Kế hoạch theo ngày
- **Day 1:** Chat API + UI integration
- **Day 2:** Realtime stream baseline
- **Day 3:** Notification center sync
- **Day 4:** Customer/Admin portal realtime polish
- **Day 5:** QA scenario + resilience tests

---

## 4) API checklist
- [ ] `GET /api/chat/[orderId]/messages`
- [ ] `POST /api/chat/[orderId]/messages`
- [ ] realtime endpoint/stream tương ứng
- [ ] `GET /api/admin/notifications`
- [ ] `PUT /api/admin/notifications/[id]/read`
- [ ] `DELETE /api/admin/notifications/[id]`

---

## 5) DoD
- [ ] Chat + notification baseline chạy ổn định
- [ ] Realtime reconnect không làm mất trạng thái chính
- [ ] Lint/type-check/build pass
