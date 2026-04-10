# LOOP Solutions — Trang còn thiếu & Mở rộng
## Phân tích từ góc nhìn Product Owner — Digital Transformation TNHH lớn
## Ngày: 2026-04-11 · Source: `src/app/` audit vs benchmark công ty chuyển đổi số hàng đầu

---

## 1. Tổng quan

**Đã xây dựng:** ~111 route/component files, 224 API routes, 99 Prisma models
**Đánh giá:** Nền tảng core rất mạnh (Orders, LP, Kanban, Academy, Admin 40 tabs).
**Còn thiếu để đạt chuẩn công ty TNHH chuyển đổi số quy mô trung-lớn:** nhiều trang public quan trọng + một số module vận hành nội bộ.

---

## 2. PUBLIC PAGES — Còn thiếu & Ưu tiên

### 🔴 P0 — Thiếu nghiêm trọng (ảnh hưởng doanh thu/tin chuyên môn)

#### 2.1 `/vi/case-studies` — Case Studies / Dự án thực tế
| | |
|---|---|
| **Lý do** | Case studies là thứ KHÁCH HÀNG DOANH NGHIỆP xem ĐẦU TIÊN trước khi liên hệ. Không có case study = không tin tưởng chuyên môn. |
| **Khác với Portfolio** | Portfolio hiện tại (6 dự án) — thiên về showcase. Case study = deep-dive: challenge → solution → methodology → measurable results (ROI, growth %, time saved). |
| **Nội dung cần có** | Tiêu đề ngắn (≤8 từ), ngành ngành (fintech/retail/manufacturing…), quy mô dự án, thời gian, team size, kết quả đo lường được, quote khách hàng, tech stack, gallery ảnh/video. |
| **Nguồn dữ liệu** | Dùng lại `Project` model — thêm field `isCaseStudy: Boolean` + `caseStudyFields: Json`. |

#### 2.2 `/vi/careers` — Tuyển dụng
| | |
|---|---|
| **Lý do** | Để tuyển nhân sự chất lượng cao, cần trang tuyển dụng chuyên nghiệp. LOOP đang dùng onboarding workflow nhưng chưa có trang public careers. |
| **Nội dung cần có** | Open positions (filter theo phòng ban/role), job description, requirements, benefits (LP, rank, training), team culture, application form. |
| **Admin cần có** | `/admin/careers` — CRUD job postings, view applications, status pipeline (applied → screening → interview → offer → hired/rejected). |

#### 2.3 `/vi/faq` — Câu hỏi thường gặp
| | |
|---|---|
| **Lý do** | Giảm tải đội ngũ sales — KH tự tìm câu trả lời. FAQ chuyên sâu về dịch vụ, quy trình, LP, bảo hành. |
| **Nội dung cần có** | Accordion UI, filter theo category (dịch vụ / kỹ thuật / thanh toán / LP / academy), search, rich text. |
| **Admin cần có** | `/admin/faq` — CRUD FAQ items, category management. |

#### 2.4 `/vi/project-tracker` — Client Project Tracking (Customer Portal mở rộng)
| | |
|---|---|
| **Lý do** | Hiện tại KH chỉ xem demo qua FigmaDemo. KH muốn biết tiến độ thực tế: thiết kế → dev → QA → deploy. Đây là **expectation tiêu chuẩn** của dịch vụ chuyển đổi số. |
| **Nội dung cần có** | Gantt/timeline view dự án, milestone tracker, current status (mỗi phase), assigned team, file delivery (Figma link, source code repo), chat với PM. |

---

### 🟡 P1 — Quan trọng (xây dựng uy tín, giảm support)

#### 2.5 `/vi/services/[slug]/pricing` — Chi tiết báo giá từng dịch vụ
| | |
|---|---|
| **Lý do** | KH muốn biết GIÁ NGAY — không phải qua wizard 8 bước. Pricing page chi tiết tăng conversion rate. |
| **Nội dung cần có** | Price range theo package, what's included/excluded, add-on pricing, payment terms, estimated timeline. |

#### 2.6 `/vi/consultation` — Đặt lịch tư vấn 1:1 (không qua wizard)
| | |
|---|---|
| **Lý do** | Nhiều KH không muốn điền wizard dài — chỉ muốn đặt lịch tư vấn ngắn gọn. Đây là entry point quan trọng cho enterprise leads. |
| **Nội dung cần có** | Calendar booking widget (Calendly-like), chọn dịch vụ quan tâm, available slots, confirmation email. |

#### 2.7 `/vi/resources` — Resource Center (blog chuyên sâu, ebook, checklist)
| | |
|---|---|
| **Lý do** | Content marketing là kênh lead gen phổ biến cho digital agency. Hiện tại có blog nhưng chưa có "resources" — tài liệu chuyên sâu, downloadable content. |

#### 2.8 `/vi/partners` — Đối tác / Tech Partners
| | |
|---|---|
| **Lý do** | Đối tác công nghệ (Shopify, HubSpot, Vercel, Supabase…) là social proof quan trọng cho KH doanh nghiệp. |

#### 2.9 `/vi/why-us` — Why LOOP / So sánh với đối thủ
| | |
|---|---|
| **Lý do** | KH enterprise muốn so sánh trước khi liên hệ. Đây là trang thường có trên website của mọi digital agency lớn. |

---

### 🟢 P2 — Tốt có (nâng cao trải nghiệm)

#### 2.10 `/vi/changelog` — Product Updates / Changelog
| | |
|---|---|
| **Lý do** | KH muốn thấy website đang phát triển. Changelog thể hiện sự chuyên nghiệp. |

#### 2.11 `/vi/testimonials` — Dedicated testimonials page (ngoài homepage)
| | |
|---|---|
| **Lý do** | Social proof chuyên sâu — KH muốn đọc review chi tiết từ khách đã hợp tác. |

#### 2.12 `/vi/newsletter` — Newsletter signup
| | |
|---|---|
| **Lý do** | Lead capture — thu thập email KH tiềm năng qua content updates. |

#### 2.13 `/vi/sitemap.xml` — Dynamic sitemap
| | |
|---|---|
| **Lý do** | SEO — hiện có sitemap nhưng cần cover hết các route động (services/[slug], portfolio/[slug], academy/[slug]). |

---

## 3. ADMIN PAGES — Còn thiếu & Ưu tiên

### 🔴 P0 — Vận hành nội bộ bắt buộc

#### 3.1 `/admin/contracts` — Hợp đồng & văn bản pháp lý
| | |
|---|---|
| **Lý do** | Mỗi dự án cần hợp đồng. Quản lý contract documents (upload, status: draft/sent/signed/expired), gắn với Order. |
| **Nội dung cần có** | Contract CRUD, upload file PDF, client e-signature, expiration alerts. |
| **Prisma model** | `Contract` (id, orderId, title, status, fileUrl, sentAt, signedAt, expiresAt) |

#### 3.2 `/admin/invoices` — Hóa đơn & thu chi (mở rộng từ Revenue)
| | |
|---|---|
| **Lý do** | Revenue page hiện tại tracking tổng quan. Cần module hóa đơn chi tiết: invoice creation, payment tracking, expense logging, P&L per project, tax reporting. |
| **Prisma model** | `Invoice` (id, orderId, invoiceNumber, amount, type: "income"|"expense", status, dueDate, paidAt, notes) + `Expense` (id, amount, category, description, date, receipt) |

#### 3.3 `/admin/media_bookings` — Media Booking Workflow
| | |
|---|---|
| **Lý do** | Media bookings hiện tại là bảng `MediaBooking` nhưng chưa có full workflow. Cần booking form + approval flow + delivery tracking. |
| **Nội dung cần có** | Pipeline: request → quote → approve → working → deliver → archive. |

#### 3.4 `/admin/hr` — HRM (Human Resource Management) — Mở rộng từ Members
| | |
|---|---|
| **Lý do** | HR phòng cần quản lý: attendance (điểm danh), leave requests (nghỉ phép), timesheets, performance reviews (360°), payroll reference data. |

---

### 🟡 P1 — Vận hành nâng cao

#### 3.5 `/admin/git_commits` — Git Commits Tracker
| | |
|---|---|
| **Lý do** | Dev push code → track commit vào TaskKanban. Integration với GitHub webhook — tự động update task status khi PR merged. |

#### 3.6 `/admin/deployments` — Deployment Tracker
| | |
|---|---|
| **Lý do** | Quản lý deploy pipeline: staging → UAT → production. Gắn với project + customer. |

#### 3.7 `/admin/knowledge` — Knowledge Base nội bộ
| | |
|---|---|
| **Lý do** | SOPs, technical docs, onboarding guides — cần nơi lưu trữ cho nhân viên. |

#### 3.8 `/admin/stands` — Daily Standup
| | |
|---|---|
| **Lý do** | Team standup tracking: what did yesterday / doing today / blockers. Tích hợp vào KanbanHub. |

#### 3.9 `/admin/clients/[id]/detail` — Chi tiết client profile (mở rộng từ Clients tab)
| | |
|---|---|
| **Lý do** | CRM chi tiết: contact history, all orders, all payments, LP balance, VIP tier, notes, assigned account manager. |

#### 3.10 `/admin/audit_log` — Audit Trail cho compliance
| | |
|---|---|
| **Lý do** | Theo dõi tất cả thay đổi (who did what when) — cần cho compliance và security audit. |

---

### 🟢 P2 — Tiện ích

#### 3.11 `/admin/calendar` — Company Calendar (sự kiện nội bộ + deadline)
#### 3.12 `/admin/customer_websites` — Customer Website Tracker (mở rộng từ `CustomerWebsite` model)
#### 3.13 `/admin/procurement` — Vendor & Procurement

---

## 4. CURRENT PAGES — Đánh giá chi tiết

### 4.1 About Page (`/vi/about`)
**Tình trạng:** Cơ bản có nội dung nhưng thiếu nhiều phần.
**Cần bổ sung:**
- [ ] Team section đầy đủ (27 members có ảnh + role)
- [ ] Timeline lịch sử công ty (founded year, milestones)
- [ ] Stats: năm thành lập, số dự án hoàn thành, số KH, số nhân sự
- [ ] Clients/Partners logos section
- [ ] Awards/Certifications section
- [ ] Office photos / virtual tour
- [ ] CTA mạnh hơn (liên hệ ngay)

### 4.2 Media Page (`/vi/media`)
**Tình trạng:** Có page + Prisma wiring + MediaClient component. ✅ Cơ bản tốt.
**Cần bổ sung:**
- [ ] Thumbnail grid với lightbox
- [ ] Filter theo booking type / industry
- [ ] Video embeds (YouTube/Vimeo)
- [ ] Client-facing booking form (`/vi/media/booking`)

### 4.3 Media Booking Client Form (không có)
**Tình trạng:** ❌ Không có route `/vi/media/booking` cho KH đặt dịch vụ media.
**Cần:**
- [ ] `GET /api/media-bookings` — list (admin)
- [ ] `POST /api/media-bookings` — create (public)
- [ ] `PUT /api/media-bookings/[id]` — update status (admin)
- [ ] `GET /api/admin/media-bookings` — admin list

---

## 5. i18n COVERAGE — Kiểm tra nhanh

| Locale | About | Services | FAQ | Careers | Case Studies | Partners | Why Us |
|--------|-------|----------|-----|---------|--------------|----------|--------|
| VI | ✅ Basic | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EN | ✅ Basic | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| JA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| KO | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ZH | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Ghi chú:** JA/KO/ZH hiện tại chỉ có một số pages cơ bản. Translations cần chuyên nghiệp (không auto-translate).

---

## 6. PRIORITIZED ROADMAP (PO Recommendation)

### 🚀 Now (Q2 2026 — 4 tuần)

| # | Task | Type | Effort | Lý do kinh doanh |
|---|------|------|--------|-----------------|
| 1 | **Case Studies page + `/admin/projects/case-studies`** | Public + Admin | Medium | Để KH enterprise tin tưởng — impact DOANH THU |
| 2 | **FAQ page + `/admin/faq`** | Public + Admin | Low | Giảm tải đội sales 20-30% |
| 3 | **Client Project Tracking portal** | Customer Portal | Medium | Kỳ vọng tiêu chuẩn — KH muốn biết tiến độ |
| 4 | **Media Bookings client form** | Public + Admin | Medium | Media bookings đang có model nhưng không có workflow |

### 📋 Next (Q2-Q3 2026 — 8 tuần)

| # | Task | Type | Effort |
|---|------|------|--------|
| 5 | **Careers page + `/admin/careers`** | Public + Admin | Medium |
| 6 | **Contracts management** | Admin | Medium |
| 7 | **Invoices + Finance module** | Admin | High |
| 8 | **Consultation booking (simple)** | Public | Low |
| 9 | **Why LOOP page** | Public | Low |
| 10 | **Partners page** | Public | Low |

### 📦 Later (Q3-Q4 2026)

| # | Task | Type | Effort |
|---|------|------|--------|
| 11 | **HRM: Leave, Timesheet, Performance** | Admin | High |
| 12 | **Resources / Content Hub** | Public + Admin | Medium |
| 13 | **Knowledge Base nội bộ** | Admin | Medium |
| 14 | **Git Commits + Deployments tracker** | Admin | Medium |
| 15 | **Testimonials dedicated page** | Public | Low |
| 16 | **Changelog page** | Public | Low |

---

## 7. BUGS & GAPS NHỎ CẦN FIX

| # | Issue | Fix |
|---|-------|-----|
| B1 | `/vi/about` dùng hardcoded inline styles thay vì design tokens (`DS`) | Migrate sang DS colors + GRD gradients |
| B2 | `/vi/services` và `/vi/dich-vu` — 2 routes trỏ cùng 1 nội dung | Consolidate, dùng redirect 301 |
| B3 | `/vi/du-an` redirect `/vi/portfolio` — không có SEO | Keep redirect, thêm canonical |
| B4 | JA/KO/ZH locales — thiếu hầu hết pages | Cần translation budget + native translator |
| B5 | No `robots.txt` optimization | Ensure `/robots.txt` covers dynamic routes |
| B6 | Media booking client-facing form không có | Cần `POST /api/media-bookings` |
| B7 | Customer Portal — KH không thể chat real-time với PM | Cần chat widget (SSE hoặc WebSocket) |
| B8 | LP rate persist — có trong SiteSetting nhưng không có UI backup | Đảm bảo `RateConfigModal` hoạt động đúng |

---

## 8. QUICK WINS (1-2 ngày)

1. **Thêm `isCaseStudy` flag vào existing `Project` model** — không cần schema change, chỉ cần filter.
2. **FAQ page với hardcoded content + Admin CRUD** — dùng existing FAQ model nếu có.
3. **Consultation booking page** — đơn giản chỉ là form → gửi notification.
4. **Why LOOP page** — dùng existing content, chỉ cần reformat.
5. **Partners page** — static content với logo grid.

---

## 9. KẾT LUẬN

LOOP Solutions có **nền tảng cốt lõi rất mạnh** — tất cả nghiệp vụ orders, LP, Kanban, Academy, gamification đều đã implement. Điểm còn thiếu tập trung ở 2 nhóm:

1. **Public pages cho doanh nghiệp:** Case Studies, FAQ, Careers, Client Project Tracking, Partners
2. **Admin modules vận hành nội bộ:** Contracts, Invoices, HRM (mở rộng từ Members), Media Bookings workflow

**Ưu tiên hàng đầu:** Case Studies + FAQ + Client Project Tracking (3 tháng đầu). Đây là các trang trực tiếp ảnh hưởng đến doanh thu và trust của khách hàng doanh nghiệp.