# FE Dependency Policy — LOOP Solutions

> **Mục tiêu:** Quản trị dependency an toàn, tránh phình bundle và giảm rủi ro supply-chain.
> **Cập nhật:** 2026-03-26

---

## 1) Principles

1. Chỉ thêm dependency khi thực sự cần.
2. Ưu tiên tái sử dụng thư viện đã có trong dự án.
3. Mỗi dependency mới phải có owner và use-case rõ.
4. Hạn chế trùng chức năng giữa nhiều package.

---

## 2) Add dependency checklist

- [ ] Nhu cầu không giải quyết được bằng code hiện có
- [ ] Đã so sánh với package đã cài sẵn
- [ ] License phù hợp
- [ ] Bundle impact chấp nhận được
- [ ] Security posture chấp nhận được
- [ ] Có kế hoạch rollback/remove nếu cần

---

## 3) Review requirements

Khi thêm package mới, PR cần nêu:
- Lý do thêm
- Module nào dùng
- Ảnh hưởng kích thước bundle
- Rủi ro bảo mật/licensing
- Kế hoạch fallback

---

## 4) Versioning rules

- Khóa version rõ ràng theo lockfile.
- Không nâng major version sát ngày release lớn.
- Nâng dependency theo batch có kiểm thử.

---

## 5) Security checks

- Chạy audit định kỳ.
- Nếu phát hiện CVE high/critical:
  - Đánh giá blast radius
  - Ưu tiên fix/upgrade
  - Nếu chưa fix được, bật mitigation tạm thời

---

## 6) Bundle hygiene

- Tránh import toàn cục thư viện nặng khi chỉ cần 1 phần nhỏ.
- Ưu tiên tree-shaking friendly imports.
- Module nặng phải lazy load khi phù hợp.

---

## 7) Ownership

- FE Lead: phê duyệt dependency phía FE.
- Security/Tech Lead: phê duyệt khi có rủi ro cao.
- DevOps: theo dõi lockfile consistency qua CI.
