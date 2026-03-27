# FE Risk Register Template — LOOP Solutions

> **Mục tiêu:** Theo dõi rủi ro tập trung cho FE/BE integration, vận hành sprint, release và scale.
> **Cập nhật:** 2026-03-26

---

## 1) Hướng dẫn sử dụng

- Mỗi rủi ro = 1 dòng trong Risk Register.
- Update tối thiểu 2 lần/tuần: đầu tuần (planning) và cuối tuần (review).
- Mọi rủi ro mức **High impact** hoặc **High probability** phải có mitigation owner + ETA rõ ràng.

---

## 2) Risk Matrix chuẩn

## Impact
- **Low (1):** ảnh hưởng nhỏ, không chặn release
- **Medium (2):** ảnh hưởng 1 module hoặc tiến độ 1-2 ngày
- **High (3):** ảnh hưởng nhiều module, có nguy cơ trễ milestone/release

## Probability
- **Low (1):** khó xảy ra
- **Medium (2):** có khả năng xảy ra
- **High (3):** dễ xảy ra/đang manh nha

## Risk Score
`Score = Impact x Probability`

- **1-2:** Low
- **3-4:** Medium
- **6-9:** High

---

## 3) Risk Register (template table)

| ID | Category | Risk Description | Impact (1-3) | Probability (1-3) | Score | Level | Owner | Mitigation Plan | Contingency Plan | ETA | Status |
|----|----------|------------------|--------------|-------------------|-------|-------|-------|------------------|------------------|-----|--------|
| R-001 | API Contract | Endpoint detail trả slug/id không nhất quán giữa module | 2 | 3 | 6 | High | FE Lead | Tạo adapter mapping và chốt contract version | Fallback query theo cả slug/id | dd/mm | Open |
| R-002 | Auth | Session cookie behavior khác giữa local/staging | 3 | 2 | 6 | High | BE Lead | Kiểm tra SameSite/Secure/Domain theo env | Tạm dùng debug endpoint session | dd/mm | Open |
| R-003 | Performance | Dashboard query nặng gây chậm order flow | 3 | 2 | 6 | High | Backend Architect | Tách analytics query async + cache | Giảm scope widget realtime | dd/mm | Open |

---

## 4) Risk Categories (chuẩn hóa)

- **API Contract**
- **Business Rule**
- **Security/Auth**
- **Performance/Scalability**
- **Data Consistency**
- **Infra/DevOps**
- **QA/Regression**
- **Timeline/Resource**
- **Dependency (team/third-party)**

---

## 5) Status lifecycle

- **Open:** mới ghi nhận, chưa xử lý xong
- **Mitigating:** đang triển khai phương án giảm rủi ro
- **Monitoring:** đã xử lý bước đầu, tiếp tục theo dõi
- **Closed:** không còn ảnh hưởng hoặc đã khóa bằng giải pháp bền vững

---

## 6) Weekly risk review checklist

- [ ] Có rủi ro mới phát sinh không?
- [ ] Rủi ro High đã có owner + ETA chưa?
- [ ] Mitigation tuần này có đạt tiến độ không?
- [ ] Có rủi ro nào cần escalate cho PO/Leadership không?
- [ ] Có rủi ro nào có thể đóng không?

---

## 7) Escalation criteria

Escalate ngay nếu thuộc một trong các điều kiện:
- Score >= 6 và ảnh hưởng P0.
- Đe dọa deadline release gần nhất.
- Có khả năng gây downtime/mất dữ liệu/lỗ hổng bảo mật.
- Phụ thuộc external team chưa có cam kết thời gian.

---

## 8) Monthly summary template

- **Top 3 risks tháng:**
  1.
  2.
  3.
- **Risk closed count:**
- **Risk reopened count:**
- **Bài học rút ra:**
- **Cập nhật policy/quy trình đề xuất:**
