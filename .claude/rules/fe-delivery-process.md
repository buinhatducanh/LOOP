# FE Delivery Process — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa quy trình PO -> Design -> Dev -> QA -> Release theo FE-first, contract-first, scale-ready.
> **Cập nhật:** 2026-03-28

---

## 1) Quy trình chuẩn end-to-end

1. **Business Clarification (PO)**
   - Chốt user flow, business rules, AC.
   - Ưu tiên theo impact: doanh thu -> vận hành -> trải nghiệm.

2. **Design Sync**
   - Mapping design -> component -> page.
   - Chốt responsive behavior.
   - Chốt đủ state: loading/empty/error/success.

3. **API Contract Check**
   - Chốt endpoint/request/response/status code trước khi code FE.
   - Thiếu endpoint → tạo backlog BE trước khi FE wiring.

4. **Implementation (FE + BE)**
   - FE giữ nguyên UI, thay data source theo roadmap phase.
   - BE bổ sung endpoint/business rule còn thiếu.
   - Không merge nếu chưa bám contract.

5. **QA Scenario Test**
   - Test theo journey (không test rời rạc).
   - Priority flows: auth, order lifecycle, wizard, LP, academy.

6. **Performance & Security Gate**
   - lint/type-check/test pass.
   - auth/permission guard đúng.
   - query/index/pagination hợp lý.

7. **Release & Observe**
   - staging -> UAT -> production.
   - theo dõi metrics/error rate sau phát hành.

---

## 2) Working agreement theo vai trò

## PO
- Chốt scope/priority/AC rõ ràng.
- Chốt dependency FE/BE trước sprint.

## Design
- Cung cấp assets/spec/tokens đầy đủ.
- Đảm bảo consistency desktop/mobile.

## FE
- Tích hợp API thật, không để mock leak production.
- Tuân thủ response conventions + UI states.
- Chỉ thay data source, giữ nguyên giao diện FE thiết kế.

## BE
- Tuân thủ response helpers + error conventions.
- Đảm bảo auth/permission/validation/pagination đúng.

## QA
- Viết test case theo business journey.
- Regression checklist trước release.

---

## 3) Checklist bắt buộc trước merge

- [ ] API contract rõ ràng
- [ ] FE dùng API thật (hoặc fallback policy rõ)
- [ ] Loading/empty/error/success states đủ
- [ ] Auth/permission flow đúng vai trò
- [ ] Lint + type-check pass
- [ ] Test trọng yếu pass
- [ ] Không làm xấu đi hiệu năng chính

---

## 4) Scale-readiness checklist (mới)

Cho feature P0/P1:
- [ ] Retry policy (client/server) rõ ràng
- [ ] Cache strategy rõ với endpoint read-heavy
- [ ] Async job strategy rõ cho tác vụ nặng
- [ ] Metrics theo dõi sau release được định nghĩa
- [ ] Rollback/fallback path có thể thực thi

---

## 5) Definition of Done (DoD)

Module chỉ hoàn thành khi:
- [ ] đúng AC
- [ ] API integration hoàn tất
- [ ] error handling + validation đầy đủ
- [ ] test phù hợp mức rủi ro
- [ ] docs liên quan cập nhật
- [ ] có kế hoạch monitor sau release

---

## 6) Gợi ý triển khai sprint (FE-first)

- Planning: chốt vertical slice theo phase roadmap (F0→F7)
- Daily sync: chốt blocker FE/BE trong ngày
- Mid-sprint review: demo end-to-end flow chính
- Sprint review: demo + KPI kỹ thuật + rủi ro mở

---

## 7) Liên kết
- `.claude/rules/fe-roadmap.md`
- `.claude/rules/fe-architecture-microservices.md`
- `.claude/rules/fe-governance-policy.md`
- `.claude/rules/fe-release-checklist.md`
- `docs/API-CONTRACT.md`
