/**
 * Mock Testimonials API — used when NEXT_PUBLIC_MOCK_API=true
 */

import { NextRequest } from "next/server";
import { requireMockApi } from "@/lib/api/mock-guard";
import { list, buildPagination } from "@/lib/api/response";

const MOCK_TESTIMONIALS = [
  { id: "1", name: "Nguyen Van A", company: "ABC Corp", text: "LOOP giúp chúng tôi xây dựng website tuyệt vời. Đội ngũ chuyên nghiệp, giao hàng đúng hạn.", rating: 5, isActive: true, sortOrder: 1 },
  { id: "2", name: "Tran Thi B", company: "XYZ Solutions", text: "Dịch vụ tối ưu SEO mang lại kết quả vượt mong đợi. Traffic tăng 300% sau 3 tháng.", rating: 5, isActive: true, sortOrder: 2 },
  { id: "3", name: "Le Van C", company: "StartupHub", text: "Ứng dụng mobile được phát triển nhanh chóng với chất lượng cao. Khách hàng rất hài lòng.", rating: 4, isActive: true, sortOrder: 3 },
  { id: "4", name: "Pham Thi D", company: "GreenLife VN", text: "Nhận diện thương hiệu mới hoàn toàn thay đổi cách khách hàng nhìn nhận công ty chúng tôi.", rating: 5, isActive: true, sortOrder: 4 },
  { id: "5", name: "Hoang Van E", company: "TechStart", text: "Team LOOP hiểu rõ nhu cầu người dùng. Sản phẩm cuối cùng vượt xa kỳ vọng ban đầu.", rating: 5, isActive: true, sortOrder: 5 },
  { id: "6", name: "Vu Thi F", company: "Bloom Cafe", text: "Website đặt bàn hoạt động mượt mà, khách hàng feedback rất tích cực.", rating: 4, isActive: true, sortOrder: 6 },
];

export async function GET(req: NextRequest) {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

  return list(MOCK_TESTIMONIALS, buildPagination(page, limit, MOCK_TESTIMONIALS.length));
}
