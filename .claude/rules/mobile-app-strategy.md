# Chiến Lược Phát Triển Mobile App — LOOP Project

## 1. Giới thiệu Kiến trúc Đích (Target Architecture)
- **Framework Chính:** React Native thông qua Expo.
- **Backend (BaaS):** Tái sử dụng 100% Next.js API Routes / Server Actions hiện có tại dự án web gốc (Next.js & Prisma).
- **Authentication:** Thay vì sử dụng bộ chặn Cookie-Based của NextAuth, phía API Mobile sẽ dùng Bearer Token (JWT / Refresh Token) để xác thực. Mobile sẽ có các route đăng nhập chuyên dụng trả về chuỗi JSON chứa JWT (VD: `/api/auth/mobile/login`).

## 2. Hệ Ngôn Ngữ UI/UX Đồng Bộ
- Thiết kế giao diện (UI) chia sẻ tư duy bằng `NativeWind` (TailwindCSS cho React Native).
- Tái sử dụng tuyệt đối `DS`, `GRD`, `GLOW` từ File `src/lib/design-tokens.ts` (Nguồn Sự Thật Duy Nhất cho màu cờ sắc áo) để map thẳng qua code Expo Component.

## 3. Quản Lý Trạng Thái (State Management)
- Tiếp tục duy trì công thức: `Zustand` (Global UI State) + `TanStack Query` (Server & Business State caching). Cách dùng hoàn toàn 1:1 giữa Web và Mobile.

## 4. Mô Hình Hai Vành Đai Ứng Dụng (App Ecosystem)

### Ứng dụng Khách Hàng (LOOP Client)
- **Truyền dẫn thông báo Realtime:** Notification trực tiếp với Firebase Cloud Messaging (FCM). Chặn SLA trễ hẹn.
- **Booking & Mua sắm:** Tích hợp thanh toán mobile payment.
- **Gamification:** Khách hàng thấy thẻ thành viên LP của họ sáng lấp lánh (với VFX Native).

### Ứng dụng Guild Nội Bộ (LOOP Guild Staff)
- Lấy mục tiêu 100% trải nghiệm là "Như game nhập vai".
- **Tính năng trọng điểm:** Huddle stand-ups, Nhận Task thẻ Kanji, Hệ thống quét Check-in văn phòng vào điểm danh XP tự động (QR/Beacon).

## 5. Chiến Lược Đóng Gói (Deployment & Distribution)
- **Distribution nội bộ lập tức:** Cấp cho nhân viên file `.apk` build bằng phương thức OTA Over The Air hoặc `eas build --platform android --local`. Tiết kiệm 0 USD. 
- **Người dùng iPhone (iOS) nội bộ:** Vận hành giả lập qua ứng dụng **Expo Go**.
- **Chỉ xuất xưởng lên CH Play / App Store:** Dành cho LOOP Client (đòi hỏi public). Bản Guild Staff sẽ luôn sideloadd nội bộ để tránh Policy review của Apple/Google.
