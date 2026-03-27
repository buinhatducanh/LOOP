# FE Branching Strategy — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa nhánh làm việc để giảm xung đột và giữ release ổn định.
> **Cập nhật:** 2026-03-26

---

## 1) Branch types

- `main`: nhánh production-ready.
- `develop` (nếu dùng): nhánh tích hợp trước release.
- `feature/<short-name>`: phát triển tính năng mới.
- `fix/<short-name>`: sửa lỗi.
- `chore/<short-name>`: bảo trì/cấu hình/tooling.
- `docs/<short-name>`: thay đổi tài liệu.

---

## 2) Rules

1. Không commit trực tiếp vào `main`.
2. Mỗi nhánh chỉ chứa 1 phạm vi thay đổi rõ ràng.
3. PR nhỏ, review nhanh, tránh PR quá lớn.
4. Bắt buộc pass quality gates trước merge.

---

## 3) Merge strategy

- Ưu tiên squash merge để lịch sử gọn.
- Commit message theo convention của repo.
- Nếu conflict lớn: re-sync nhánh sớm, không để dồn cuối sprint.

---

## 4) Hotfix flow

1. Tạo `fix/<urgent-issue>` từ `main`.
2. Sửa + test tối thiểu critical path.
3. Tạo PR ưu tiên cao, review nhanh.
4. Deploy + monitor.
5. Back-merge vào `develop` (nếu có).

---

## 5) Branch hygiene

- Xóa branch sau khi merge.
- Không giữ branch stale quá 14 ngày.
- Rebase/sync định kỳ với nhánh gốc để giảm conflict.
