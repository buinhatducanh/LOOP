# FE Feature Flag Policy — LOOP Solutions

> **Mục tiêu:** Quản trị feature flags nhất quán để rollout an toàn và giảm rủi ro production.
> **Cập nhật:** 2026-03-26

---

## 1) Principles

1. Flag trước, release sau: tính năng rủi ro cần có cờ bật/tắt.
2. Default-safe: cờ mới mặc định `off` ở production trừ khi có phê duyệt.
3. Time-bound: flag không tồn tại vĩnh viễn, phải có kế hoạch cleanup.

---

## 2) Flag categories

- **Release flag:** kiểm soát rollout tính năng mới.
- **Ops flag:** bật/tắt behavior vận hành (realtime, effects nặng).
- **Experiment flag:** A/B test ngắn hạn.
- **Kill switch:** tắt nhanh một module lỗi khi incident.

---

## 3) Naming convention

`<domain>_<feature>_<purpose>`

Ví dụ:
- `realtime_chat_release`
- `team_effects_killswitch`
- `media_booking_release`
- `academy_video_gate_release`

---

## 4) Lifecycle

1. **Create:** định nghĩa tên, owner, default, expiry.
2. **Rollout:** bật theo env/segment.
3. **Observe:** theo dõi KPI/error rate.
4. **Finalize:** full on hoặc rollback off.
5. **Cleanup:** remove code path cũ + xóa flag.

---

## 5) Required metadata per flag

- Flag name
- Owner
- Purpose
- Default per env (dev/staging/prod)
- Rollout plan
- Success metrics
- Expiry date
- Cleanup task ID

---

## 6) Rollout strategy

- Staging: bật 100% để test đầy đủ.
- Production: rollout dần (5% -> 20% -> 50% -> 100%) khi phù hợp.
- Nếu không có segmentation, rollout theo thời gian + monitoring window.

---

## 7) Guardrails

- Không dùng flag để bypass auth/permission/security checks.
- Không tạo dependency chồng chéo quá nhiều flags trên cùng flow.
- Mỗi feature quan trọng tối đa 1 release flag + 1 killswitch.

---

## 8) Flag cleanup checklist

- [ ] Quyết định final (on/off) đã chốt
- [ ] Code path không dùng đã xóa
- [ ] Docs đã cập nhật
- [ ] Flag removed khỏi env config
