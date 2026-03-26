# FE Documentation Maintenance Policy — LOOP Solutions

> **Mục tiêu:** Giữ bộ tài liệu FE luôn đúng thực tế, tránh lỗi thời.
> **Cập nhật:** 2026-03-26

---

## 1) Scope

Áp dụng cho toàn bộ tài liệu trong `.claude/rules` liên quan FE roadmap, process, governance, release.

---

## 2) Update triggers

Bắt buộc cập nhật docs khi có một trong các thay đổi:
- Thay đổi scope roadmap/phase.
- Thay đổi API contract ảnh hưởng FE.
- Thay đổi governance/SLA/escalation.
- Thay đổi release process hoặc quality gates.
- Thêm module mới vào tuần/sprint plan.

---

## 3) Ownership

- **Primary owner:** FE Lead
- **Co-owners:** BE Lead, QA Lead, PO
- **Review cadence:** weekly (nhẹ) + monthly (đầy đủ)

---

## 4) Documentation SLA

- Minor update: trong vòng 1 ngày làm việc sau khi thay đổi được chốt.
- Major update: trong vòng 2 ngày làm việc + thông báo stakeholder.

---

## 5) Versioning rules

- Cập nhật trường `Cập nhật:` ở đầu file.
- Nếu thay đổi lớn, ghi thêm mục `Change log` ngắn ở cuối file.
- Master index phải được cập nhật đồng bộ khi thêm/xóa tài liệu.

---

## 6) Quality checklist cho docs

- [ ] Nội dung rõ ràng, ngắn gọn, hành động được.
- [ ] Không mâu thuẫn với API contract/guidelines hiện hành.
- [ ] Link tham chiếu còn đúng.
- [ ] Không có section trùng lặp.

---

## 7) Audit process

- Weekly: kiểm tra nhanh các doc mới sửa.
- Monthly: audit toàn bộ master index + top 10 doc sử dụng nhiều nhất.
- Quarterly: loại bỏ doc dư thừa, gộp doc trùng mục tiêu.
