# FE Release Runbook — LOOP Solutions

> **Mục tiêu:** Hướng dẫn thao tác release theo từng bước, giảm sai sót vận hành.
> **Cập nhật:** 2026-03-26

---

## 1) Preconditions

- [ ] Scope release đã freeze
- [ ] PR đã merge đúng branch strategy
- [ ] `fe-release-checklist.md` đã pass
- [ ] QA sign-off hoàn tất
- [ ] Rollback owner đã sẵn sàng

---

## 2) Release steps (staging -> production)

1. Deploy staging
2. Chạy sanity smoke staging
3. Chốt Go/No-Go
4. Deploy production
5. Chạy post-deploy smoke
6. Theo dõi monitoring 30-60 phút đầu

---

## 3) Go/No-Go criteria

## Go khi:
- Không còn blocker
- Critical flow pass
- Monitoring baseline ổn định

## No-Go khi:
- Contract mismatch critical chưa fix
- Incident mở mức SEV-1/2 liên quan scope
- Build hoặc smoke fail

---

## 4) Rollback triggers

- Error rate tăng bất thường sau deploy
- Auth flow lỗi diện rộng
- Order/checkout flow lỗi critical
- API latency vượt ngưỡng nghiêm trọng kéo dài

---

## 5) Communication timeline

- T-30m: thông báo chuẩn bị release
- T-0: thông báo bắt đầu release
- T+15m: cập nhật trạng thái sơ bộ
- T+60m: xác nhận ổn định hoặc rollback

---

## 6) Post-release checklist

- [ ] Xác nhận KPI kỹ thuật không xấu đi
- [ ] Cập nhật changelog final
- [ ] Ghi nhận issue phát sinh
- [ ] Mở action items hậu kiểm nếu cần
