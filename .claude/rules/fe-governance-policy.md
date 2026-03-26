# FE Governance Policy — LOOP Solutions

> **Mục tiêu:** Thiết lập governance chuẩn cho triển khai FE/BE integration ở mức enterprise: rõ vai trò, SLA, escalation, change control.
> **Cập nhật:** 2026-03-26

---

## 1) Scope

Policy này áp dụng cho:
- Tất cả thay đổi liên quan FE roadmap, API integration, release và vận hành weekly.
- Các team: PO, Design, FE, BE, QA, DevOps, Support.

---

## 2) Governance principles

1. **Business alignment trước kỹ thuật**: mọi thay đổi phải bám mục tiêu nghiệp vụ.
2. **Contract-first delivery**: FE không triển khai ngoài contract đã chốt.
3. **Quality gate bắt buộc**: không bypass lint/type-check/test/review.
4. **Risk transparency**: rủi ro phải được ghi vào risk register, có owner/ETA.
5. **Controlled change**: thay đổi scope phải qua change control.

---

## 3) RACI (chuẩn trách nhiệm)

| Domain | PO | Design | FE | BE | QA | DevOps | Support |
|--------|----|--------|----|----|----|--------|---------|
| Business scope & AC | A/R | C | C | C | C | I | I |
| UI/UX spec & assets | C | A/R | C | I | C | I | I |
| API contract | A | I | C | R | C | I | I |
| FE implementation | C | C | A/R | C | C | I | I |
| BE implementation | C | I | C | A/R | C | I | I |
| Test strategy | C | I | C | C | A/R | I | I |
| Release execution | I | I | C | C | C | A/R | I |
| Incident response | I | I | C | C | C | A/R | R |

Legend: **A** = Accountable, **R** = Responsible, **C** = Consulted, **I** = Informed

---

## 4) Decision rights

- **PO**: quyết định scope, priority, trade-off business.
- **Tech Lead (FE/BE)**: quyết định kỹ thuật implementation trong phạm vi contract.
- **QA Lead**: quyết định quality sign-off.
- **DevOps Lead**: quyết định release window và rollback execution.

Khi có xung đột:
1. Ưu tiên an toàn hệ thống và dữ liệu.
2. Escalate PO + Tech Lead + QA Lead để chốt trong SLA.

---

## 5) SLA vận hành

## Blocker SLA
- **P0 blocker (release/business critical):** phản hồi <= 30 phút, workaround <= 4 giờ.
- **P1 blocker:** phản hồi <= 2 giờ, xử lý <= 1 ngày.
- **P2 issue:** phản hồi <= 1 ngày, xử lý theo sprint capacity.

## PR Review SLA
- PR P0/P1: review vòng 1 <= 4 giờ làm việc.
- PR P2: review vòng 1 <= 1 ngày làm việc.

## Contract change SLA
- Minor contract change: quyết định <= 1 ngày.
- Major contract change: quyết định <= 2 ngày + update docs bắt buộc.

---

## 6) Escalation path

### Level 1 — Team level
- Owner task + Tech Lead xử lý trực tiếp.

### Level 2 — Cross-team
- FE/BE/QA lead sync nhanh để chốt workaround.

### Level 3 — Leadership
- Escalate PO + Engineering Manager khi:
  - rủi ro score >= 6
  - trễ milestone > 2 ngày
  - có nguy cơ ảnh hưởng production/revenue

---

## 7) Change control policy

Mọi thay đổi ngoài sprint scope phải theo quy trình:
1. Tạo Change Request (CR) với mô tả lý do + impact.
2. Đánh giá impact lên timeline, quality, dependency.
3. PO + Tech Lead + QA Lead approve/reject.
4. Nếu approve: cập nhật roadmap + weekly plan + release scope.

### Change Request template (rút gọn)
- **CR ID:**
- **Requested by:**
- **Reason:**
- **Business impact:**
- **Technical impact:**
- **Risk impact:**
- **Decision:** approve/reject
- **Approvers:**

---

## 8) Definition of Ready (DoR)

Một task chỉ được bắt đầu khi:
- [ ] Có business acceptance criteria rõ ràng
- [ ] Có API contract (hoặc action item BE rõ ràng)
- [ ] Có design spec tối thiểu (nếu là UI task)
- [ ] Có owner + estimate + dependencies

---

## 9) Definition of Done (Governance)

Một deliverable chỉ đóng khi:
- [ ] Đạt AC và quality gates
- [ ] Không còn blocker bug mở
- [ ] Docs liên quan đã cập nhật
- [ ] Báo cáo tuần cập nhật trạng thái

---

## 10) Audit cadence

- **Hàng tuần:** review status report + risk register + release readiness.
- **Hàng tháng:** audit process compliance + SLA compliance.
- **Hàng quý:** rà soát roadmap, kiến trúc và điều chỉnh governance.

---

## 11) Non-compliance handling

Nếu bypass quy trình (skip review/test/contract):
1. Ghi nhận incident process.
2. Đánh giá tác động.
3. Bổ sung corrective action vào sprint kế tiếp.
4. Tái đào tạo guideline nếu cần.
