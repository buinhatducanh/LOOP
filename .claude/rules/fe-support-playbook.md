# FE Support Playbook — LOOP Solutions

> **Mục tiêu:** Quy trình xử lý yêu cầu hỗ trợ liên quan FE sau release.
> **Cập nhật:** 2026-03-26

---

## 1) Intake channels

- Support ticket system (ưu tiên)
- Incident channel (khẩn cấp)
- Customer success escalation

---

## 2) Triage levels

- **Urgent:** ảnh hưởng giao dịch chính hoặc diện rộng.
- **High:** ảnh hưởng nhóm user quan trọng.
- **Normal:** ảnh hưởng cục bộ.
- **Low:** yêu cầu cải thiện/cosmetic.

---

## 3) Response workflow

1. Nhận ticket
2. Xác minh mức độ ảnh hưởng
3. Gán owner + ETA
4. Cập nhật trạng thái định kỳ
5. Đóng ticket với bằng chứng xử lý

---

## 4) SLA gợi ý

- Urgent: phản hồi <= 30 phút
- High: phản hồi <= 2 giờ
- Normal: phản hồi <= 1 ngày
- Low: phản hồi <= 2 ngày

---

## 5) Knowledge capture

Mỗi ticket quan trọng sau xử lý cần lưu:
- Root cause ngắn
- Fix summary
- Link PR/release
- Hành động phòng ngừa lặp lại

---

## 6) Escalation criteria

Escalate sang incident playbook nếu:
- Lỗi lặp lại nhiều lần cùng flow
- Ảnh hưởng diện rộng
- Cần rollback/hotfix production
