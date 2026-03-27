# FE Backlog Triage Policy — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa cách nhận, phân loại, ưu tiên và xử lý backlog FE.
> **Cập nhật:** 2026-03-26

---

## 1) Triage cadence

- Daily quick triage: bug/blocker mới.
- Weekly full triage: toàn bộ backlog mở.

---

## 2) Ticket classification

- Feature
- Bug
- Tech debt
- Performance
- Security
- Documentation

---

## 3) Priority model

- **P0:** chặn business/release hoặc lỗi critical flow.
- **P1:** ảnh hưởng lớn nhưng có workaround.
- **P2:** cải tiến quan trọng, chưa khẩn cấp.
- **P3:** nice-to-have.

---

## 4) Triage checklist

- [ ] Mô tả vấn đề rõ ràng
- [ ] Scope và module liên quan
- [ ] Mức ảnh hưởng business
- [ ] Repro steps (với bug)
- [ ] Expected vs actual behavior
- [ ] Owner tạm thời
- [ ] Priority gán rõ

---

## 5) Entry criteria

Ticket vào sprint khi:
- [ ] Có AC rõ ràng
- [ ] Có estimate
- [ ] Dependencies đã xác định
- [ ] Không thiếu thông tin critical

---

## 6) Exit criteria

Ticket đóng khi:
- [ ] Done theo AC
- [ ] Pass quality gates
- [ ] Có ghi chú test/verify
- [ ] Docs liên quan được cập nhật (nếu cần)

---

## 7) Aging policy

- Ticket > 30 ngày chưa xử lý: bắt buộc review lại priority.
- Ticket > 60 ngày: quyết định giữ, gộp, hoặc đóng.
