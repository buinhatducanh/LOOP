# FE Data Contract Checklist — LOOP Solutions

> **Mục tiêu:** Checklist xác minh data contract FE<->BE trước khi triển khai và trước release.
> **Cập nhật:** 2026-03-26

---

## 1) Schema alignment

- [ ] Field names khớp contract
- [ ] Field types khớp contract
- [ ] Nullable/optional fields rõ ràng
- [ ] Enum values khớp backend

---

## 2) Response shape

- [ ] Single: `{ data }`
- [ ] List: `{ data, pagination }`
- [ ] Error: `{ error, code? }`

---

## 3) Status codes

- [ ] 200/201 đúng context
- [ ] 400/401/403/404/409/422/429/500 xử lý đúng ở UI

---

## 4) Pagination contract

- [ ] page/limit accepted
- [ ] total/totalPages returned
- [ ] edge cases page out-of-range handled

---

## 5) Backward compatibility

- [ ] Không breaking field removal ngoài kế hoạch
- [ ] Nếu có breaking change: có CR + migration plan
- [ ] FE adapter tạm thời (nếu cần) có expiry plan

---

## 6) Sign-off

- FE Lead:
- BE Lead:
- QA Lead:
- Date:
