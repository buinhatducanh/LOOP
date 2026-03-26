# FE Communication Plan — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa nhịp giao tiếp giữa PO/Design/FE/BE/QA để giảm trễ và giảm hiểu nhầm.
> **Cập nhật:** 2026-03-26

---

## 1) Ceremonies & cadence

## Daily
- **Standup (15 phút):** tiến độ, blocker, plan trong ngày.
- **Async update:** cập nhật cuối ngày theo template ngắn.

## Weekly
- **Planning:** chốt scope tuần + dependencies.
- **Mid-week checkpoint:** kiểm tra rủi ro, điều chỉnh scope.
- **Review & retro:** demo flow + bài học + action items.

## Release-based
- **Go/No-Go meeting:** trước production release.
- **Post-release review:** 24h sau release.

---

## 2) Communication channels

- **#fe-delivery:** cập nhật delivery hàng ngày.
- **#fe-be-contract:** xử lý contract/API mismatch.
- **#release-room:** điều phối release/incidents.
- **Ticketing board:** nguồn sự thật cho scope/status.

---

## 3) Message templates

## Daily update template
- **Done:**
- **Today:**
- **Blockers:**
- **Need help from:**

## Blocker escalation template
- **Issue:**
- **Impact:**
- **Blocked tasks:**
- **Need decision by:**
- **Owner:**

## Release update template
- **Version:**
- **Status:** on_track/at_risk
- **Open blockers:**
- **ETA:**

---

## 4) Decision logging

Mọi quyết định ảnh hưởng scope/contract/release cần log:
- Quyết định gì?
- Vì sao?
- Ai approve?
- Ảnh hưởng module nào?
- Effective từ thời điểm nào?

---

## 5) Communication SLA

- Blocker message: phản hồi ban đầu <= 30 phút trong giờ làm việc.
- Contract clarification: phản hồi <= 4 giờ.
- Release critical question: phản hồi <= 15 phút.

---

## 6) Anti-patterns cần tránh

- Trao đổi ngoài ticket rồi không cập nhật lại nguồn sự thật.
- Chốt thay đổi scope bằng miệng, không log quyết định.
- Để blocker qua ngày mà không escalate.
