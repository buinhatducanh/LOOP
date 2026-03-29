# FE Code Review Checklist — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa review code FE để đảm bảo chất lượng, hiệu năng và bảo mật.
> **Cập nhật:** 2026-03-29

---

## 1) Functionality

- [ ] Code giải quyết đúng yêu cầu nghiệp vụ/AC.
- [ ] Không làm vỡ flow hiện có.
- [ ] Edge cases quan trọng đã xử lý.

---

## 2) API integration

- [ ] Endpoint đúng contract.
- [ ] Response mapping typed rõ ràng.
- [ ] Error handling đủ cho status quan trọng.
- [ ] Không còn mock data cho phần đã release.
- [ ] **Locale-aware API call:** endpoint content/pricing/public có `?lang={locale}` hoặc mapping multilingual fields rõ.
- [ ] **Fallback contract:** thiếu translation field phải fallback `vi`, không để null/undefined hiển thị trực tiếp.
- [ ] **Locale-aware API call:** endpoint content/pricing/public có `?lang={locale}` hoặc mapping multilingual fields rõ.
- [ ] **Fallback contract:** thiếu translation field phải fallback `vi`, không để null/undefined hiển thị trực tiếp.

---

## 3) UI/UX states

- [ ] Có loading state.
- [ ] Có empty state.
- [ ] Có error state.
- [ ] Có success/confirmation state khi cần.
- [ ] **Locale URL chuẩn:** user-facing page dùng `/:locale/...` (vi/en/ja/ko/zh), không dùng route phẳng.
- [ ] **Locale switch UX:** đổi ngôn ngữ không làm mất state quan trọng của flow đang thao tác (đặc biệt Booking Wizard).
- [ ] **Locale URL chuẩn:** user-facing page dùng `/:locale/...` (vi/en/ja/ko/zh), không dùng route phẳng.
- [ ] **Locale switch UX:** đổi ngôn ngữ không làm mất state quan trọng của flow đang thao tác (đặc biệt Booking Wizard).

---

## 4) Performance

- [ ] Không fetch dư thừa.
- [ ] Query cache/invalidation hợp lý.
- [ ] Component tránh re-render không cần thiết.
- [ ] Module nặng có lazy loading/code splitting khi cần.

---

## 5) Security

- [ ] Không lộ data nhạy cảm trong log/UI.
- [ ] Không thêm logic bypass auth/permission.
- [ ] Input được validate/sanitize ở mức phù hợp.

---

## 6) Maintainability

- [ ] Tên biến/hàm rõ nghĩa.
- [ ] Tách module hợp lý, tránh file quá lớn.
- [ ] Tránh duplicate logic.
- [ ] Comment ngắn gọn ở đoạn logic khó.

---

## 7) i18n compliance (hard gate cho public/customer features)

- [ ] Route có locale prefix `/:locale/...`.
- [ ] Locale từ URL được sync đúng vào global store.
- [ ] API call gửi đúng `lang` theo locale hiện tại.
- [ ] Fallback `vi` hoạt động khi thiếu translation.
- [ ] 5-locale sanity smoke pass (`vi|en|ja|ko|zh`) cho flow liên quan.

---

## 8) Testing & quality gates

- [ ] Lint pass.
- [ ] Type-check pass.
- [ ] Build pass.
- [ ] Test liên quan pass (nếu có).

---

## 9) Reviewer decision

- [ ] Approve
- [ ] Request changes
- **Notes:**
