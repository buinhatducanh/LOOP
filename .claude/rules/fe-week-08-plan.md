# FE Week 08 Plan — LOOP Solutions

> **Tuần:** Week 08
> **Mục tiêu tuần:** Hoàn thiện Effects/Quest/Event vận hành thực tế trên dashboard và team pages.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Effects admin views (list/by-rank/by-member) dùng API thật.
2. Quest/Event hiển thị và vận hành theo dữ liệu backend.
3. Team/Member pages phản ánh unlock/visibility đúng trạng thái.

---

## 2) Scope tuần 08

## P0
- [ ] Effects CRUD integration.
- [ ] Global toggle integration.
- [ ] Quest/Event list + status integration.
- [ ] Team page effect rendering theo dữ liệu thật.

## P1
- [ ] Member override effect visibility.
- [ ] Quest progress display baseline.

## P2
- [ ] Tối ưu animation perf khi nhiều hiệu ứng đồng thời.

---

## 3) Kế hoạch theo ngày
- **Day 1:** Effects APIs + admin list
- **Day 2:** by-rank/by-member views
- **Day 3:** Quest/Event integration
- **Day 4:** Team/member sync + polish
- **Day 5:** QA + performance checks

---

## 4) API checklist
- [ ] `GET/POST/PUT/DELETE /api/admin/effects`
- [ ] `PUT /api/admin/effects/global-toggle`
- [ ] `GET/POST/PUT/DELETE /api/admin/quests`
- [ ] `GET/POST/PUT/DELETE /api/admin/events`
- [ ] `GET /api/team` + effect metadata

---

## 5) DoD
- [ ] Effects/Quest/Event dùng API thật
- [ ] Team effects hiển thị đúng theo rule
- [ ] Lint/type-check/build pass
