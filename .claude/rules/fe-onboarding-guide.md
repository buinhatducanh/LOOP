# FE Team Onboarding Guide — LOOP Solutions

> **Mục tiêu:** Giúp thành viên mới vào dự án nắm nhanh bối cảnh, quy trình và cách bắt đầu đóng góp an toàn.
> **Cập nhật:** 2026-03-26

---

## 1) Day 0: Read-first checklist

Đọc theo thứ tự:
1. `.claude/CLAUDE.md`
2. `.claude/rules/fe-master-index.md`
3. `.claude/rules/fe-roadmap.md`
4. `.claude/rules/fe-delivery-process.md`
5. `.claude/rules/fe-architecture-microservices.md`
6. `docs/API-CONTRACT.md`

---

## 2) Day 1: Local setup checklist

- [ ] Clone repo và cài dependencies.
- [ ] Chạy backend local (`npm run dev` trong root backend).
- [ ] Chạy frontend local (repo FE tương ứng).
- [ ] Cấu hình env theo `fe-environment-matrix.md`.
- [ ] Verify auth flow local hoạt động.

---

## 3) Day 2: First contribution checklist

- [ ] Chọn task nhỏ thuộc week plan hiện tại.
- [ ] Xác nhận API contract trước khi code.
- [ ] Implement + self-test flow liên quan.
- [ ] Chạy lint/type-check/build.
- [ ] Tạo PR theo checklist review.

---

## 4) Do & Don’t

## Do
- Bám roadmap và week plan.
- Báo blocker sớm theo communication plan.
- Cập nhật ticket rõ ràng khi đổi trạng thái.

## Don’t
- Không merge code chưa pass quality gates.
- Không tự ý thay contract không qua CR.
- Không để mock data lẫn vào flow production.

---

## 5) New member 7-day plan

- **Day 1-2:** đọc tài liệu + setup local.
- **Day 3-4:** shadow một module đang chạy sprint.
- **Day 5-6:** nhận task độc lập nhỏ, có review chặt.
- **Day 7:** demo kết quả + retro cá nhân + plan tuần tiếp.

---

## 6) Support path

- Contract/API: trao đổi tại kênh contract và tag FE+BE lead.
- Release/process: theo governance policy.
- Blocker kỹ thuật: escalate theo incident/communication plan.
