# FE Week 11 Plan — LOOP Solutions

> **Tuần:** Week 11
> **Mục tiêu tuần:** Tối ưu hiệu năng FE trên các trang nặng (dashboard, charts, media, team effects).
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Giảm thời gian tải và render cho các trang trọng điểm.
2. Giảm số request dư thừa bằng caching/query tuning.
3. Giữ UX mượt khi dữ liệu lớn.

---

## 2) Scope tuần 11

## P0
- [ ] Audit bundle và route-level code splitting.
- [ ] Tối ưu query cache/revalidate/stale time.
- [ ] Tối ưu list lớn (pagination/infinite/virtualization nếu cần).
- [ ] Tối ưu media/image loading.

## P1
- [ ] Tối ưu charts render frequency.
- [ ] Tối ưu animation nặng ở team/effects.

## P2
- [ ] Prefetch thông minh cho route có khả năng truy cập cao.

---

## 3) Kế hoạch theo ngày
- **Day 1:** Profiling baseline + budget mục tiêu
- **Day 2:** Bundle/code split optimization
- **Day 3:** Query/request optimization
- **Day 4:** UI render/perf tuning
- **Day 5:** Re-measure + report improvements

---

## 4) KPI kỹ thuật
- [ ] Initial load time giảm so với baseline
- [ ] P95 API-dependent view render cải thiện
- [ ] Request count/trang trọng điểm giảm

---

## 5) DoD
- [ ] Có số đo trước/sau rõ ràng
- [ ] Không làm vỡ nghiệp vụ hiện có
- [ ] Lint/type-check/build pass
