# FE Incident Playbook — LOOP Solutions

> **Mục tiêu:** Quy trình xử lý sự cố production/staging liên quan FE integration.
> **Cập nhật:** 2026-03-26

---

## 1) Severity levels

- **SEV-1:** down/outage hoặc ảnh hưởng nghiêm trọng đến giao dịch chính.
- **SEV-2:** lỗi lớn ảnh hưởng nhiều người dùng nhưng còn workaround.
- **SEV-3:** lỗi cục bộ, ảnh hưởng giới hạn.
- **SEV-4:** lỗi nhỏ/cosmetic.

---

## 2) Incident flow

1. **Detect**: monitoring/support/user report.
2. **Triage**: xác định severity, phạm vi ảnh hưởng.
3. **Assign**: chỉ định Incident Commander + owner kỹ thuật.
4. **Mitigate**: rollback/hotfix/workaround.
5. **Recover**: xác nhận hệ thống ổn định.
6. **Postmortem**: nguyên nhân gốc + hành động phòng ngừa.

---

## 3) Roles during incident

- **Incident Commander (IC):** điều phối tổng thể, quyết định nhịp xử lý.
- **Technical Owner (FE/BE):** xử lý kỹ thuật trực tiếp.
- **QA On-call:** xác minh fix/recovery.
- **Comms Owner:** cập nhật stakeholder/status page.

---

## 4) Response SLA

- **SEV-1:** ack <= 15 phút, update mỗi 30 phút.
- **SEV-2:** ack <= 30 phút, update mỗi 1 giờ.
- **SEV-3:** ack <= 2 giờ, update theo mốc xử lý.

---

## 5) Tactical checklist

- [ ] Xác định blast radius
- [ ] Dừng rollout nếu đang deploy
- [ ] Thu thập logs/errors/traces
- [ ] Chọn rollback hoặc hotfix
- [ ] Xác minh user journey chính sau fix
- [ ] Cập nhật stakeholder

---

## 6) Postmortem template

- **Incident ID:**
- **Start time / End time:**
- **Severity:**
- **Impact summary:**
- **Root cause:**
- **Contributing factors:**
- **What worked well:**
- **What failed:**
- **Action items (owner + ETA):**

---

## 7) Exit criteria

- [ ] Sự cố được khắc phục
- [ ] Monitoring ổn định sau recovery window
- [ ] Postmortem hoàn thành
- [ ] Action items đã vào backlog
