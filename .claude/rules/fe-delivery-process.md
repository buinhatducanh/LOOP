# FE Delivery Process — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa quy trình làm việc PO -> Design -> Dev -> QA -> Release cho FE mới.
> **Cập nhật:** 2026-03-26

---

## 1) Quy trình chuẩn end-to-end

1. **Business Clarification (PO)**
   - Chốt user flow, business rules, acceptance criteria.
   - Ưu tiên theo impact: doanh thu -> vận hành -> trải nghiệm.

2. **Design Sync**
   - Mapping asset/design -> component -> page.
   - Chốt responsive behavior theo breakpoint.
   - Chốt trạng thái UI bắt buộc: loading/empty/error/success.

3. **API Contract Check**
   - Đối chiếu endpoint/request/response/status code trước khi code FE.
   - Nếu thiếu endpoint, tạo backlog BE trước khi FE tích hợp.

4. **Implementation (FE + BE)**
   - FE triển khai theo module ưu tiên.
   - BE bổ sung endpoint/business rule còn thiếu.
   - Không merge nếu chưa bám đúng contract.

5. **QA Scenario Test**
   - Test theo hành trình user (E2E flow), không chỉ test component rời rạc.
   - Ưu tiên test các flow: auth, order lifecycle, wizard, LP, academy.

6. **Performance & Security Gate**
   - Lint + type-check + test pass.
   - Check permission/auth guard.
   - Check query/pagination/index để tránh bottleneck.

7. **Release & Observe**
   - Deploy staging -> UAT -> production.
   - Theo dõi logs/metrics/error rate sau phát hành.

---

## 2) Working agreement theo vai trò

## PO
- Định nghĩa scope/priority và acceptance criteria rõ ràng.
- Chốt dependency FE/BE trước sprint.

## Design
- Cung cấp đầy đủ assets/spec/tokens.
- Đảm bảo tính nhất quán desktop/mobile.

## FE
- Tích hợp API thật, không để mock leak vào production.
- Tuân thủ response conventions + state handling chuẩn.

## BE
- Tuân thủ `@/lib/api` helpers + error conventions.
- Đảm bảo permission, validation, pagination, status code đúng.

## QA
- Viết test case theo hành trình nghiệp vụ.
- Regression checklist trước mỗi release.

---

## 3) Checklist bắt buộc trước merge

- [ ] Có API contract rõ ràng cho feature
- [ ] FE dùng API thật (không mock cục bộ)
- [ ] Loading/empty/error/success states đầy đủ
- [ ] Permission/auth flow đúng vai trò
- [ ] Lint + type-check pass
- [ ] Test trọng yếu pass
- [ ] Không ảnh hưởng tiêu cực đến hiệu năng chính

---

## 4) Definition of Done (DoD)

Một module chỉ hoàn thành khi:
- [ ] Đúng nghiệp vụ theo acceptance criteria
- [ ] API integration hoàn tất
- [ ] Error handling + validation đầy đủ
- [ ] Có test phù hợp mức độ rủi ro
- [ ] Có thể triển khai mà không block module khác

---

## 5) Gợi ý triển khai sprint

- Sprint planning: chốt scope theo vertical slice (public -> order -> admin).
- Daily sync: chốt blocker FE/BE nhanh trong ngày.
- Mid-sprint review: demo flow chính, không demo UI rời rạc.
- Sprint review: demo end-to-end + KPI kỹ thuật.

---

## 6) Liên kết
- `.claude/rules/fe-roadmap.md`
- `.claude/rules/fe-architecture-microservices.md`
- `docs/API-CONTRACT.md`
- `.claude/rules/testing.md`
