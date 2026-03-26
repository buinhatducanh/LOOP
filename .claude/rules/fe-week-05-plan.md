# FE Week 05 Plan — LOOP Solutions

> **Tuần:** Week 05
> **Mục tiêu tuần:** Hoàn thiện Academy flow thật (enrollment/progress/video gate/certificate baseline).
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Academy list/detail/enrollment chạy API thật.
2. Course progress tracking và lesson completion hoạt động.
3. Video gate rule cơ bản được enforce.

---

## 2) Scope tuần 05

## P0
- [ ] Academy list/detail integration.
- [ ] Enrollment flow thật (VNĐ/LP+VNĐ tối thiểu).
- [ ] Lesson completion + progress %.
- [ ] Video gate check trước khi mở bài tiếp.

## P1
- [ ] Comment cơ bản trong lesson.
- [ ] Certificate eligibility check.
- [ ] Admin academy student progress view baseline.

## P2
- [ ] Exercise panel sync backend.

---

## 3) Kế hoạch theo ngày
- **Day 1:** Course list/detail API
- **Day 2:** Enrollment + payment baseline
- **Day 3:** Progress + completion
- **Day 4:** Video gate + comments
- **Day 5:** QA + hardening

---

## 4) API checklist
- [ ] `GET /api/v1/courses`
- [ ] `GET /api/v1/courses/[id|slug]`
- [ ] `POST /api/academy/enroll`
- [ ] `GET /api/academy/progress/[courseId]`
- [ ] `POST /api/academy/lessons/[id]/complete`
- [ ] `GET /api/academy/certificate/[courseId]` (baseline)

---

## 5) DoD
- [ ] Academy core flow dùng API thật
- [ ] Video gate baseline chạy đúng
- [ ] Progress tracking chính xác
- [ ] Lint/type-check/build pass
