# FE Security Review Checklist — LOOP Solutions

> **Mục tiêu:** Checklist review bảo mật cho thay đổi FE trước khi release.
> **Cập nhật:** 2026-03-26

---

## 1) Auth & session

- [ ] Route cần bảo vệ đã có guard đúng
- [ ] Không lưu token nhạy cảm ở nơi không an toàn
- [ ] Session timeout/refresh behavior đúng thiết kế

---

## 2) Data handling

- [ ] Không log dữ liệu nhạy cảm
- [ ] Không render dữ liệu chưa sanitize theo cách nguy hiểm
- [ ] Không expose thông tin nội bộ qua error message

---

## 3) API interaction

- [ ] Endpoint admin có permission checks ở backend
- [ ] FE xử lý đúng 401/403/429
- [ ] Không để client-side logic giả lập quyền truy cập

---

## 4) Input & output safety

- [ ] Input người dùng được validate trước submit
- [ ] File upload (nếu có) có ràng buộc type/size theo contract
- [ ] URL bên ngoài được kiểm soát khi render/linking

---

## 5) Third-party & dependencies

- [ ] Không thêm third-party script không rõ nguồn
- [ ] Dependency mới đã qua dependency policy
- [ ] Không có CVE high/critical chưa xử lý cho scope release

---

## 6) Runtime hardening

- [ ] Feature flags nhạy cảm có default-safe
- [ ] Kill switch sẵn cho module rủi ro cao
- [ ] Không có debug mode bật ở production

---

## 7) Sign-off

- Reviewer:
- Result: pass / conditional / fail
- Notes:
