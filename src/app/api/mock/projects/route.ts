/**
 * Mock Projects API — used when NEXT_PUBLIC_MOCK_API=true
 */

import { NextRequest } from "next/server";
import { requireMockApi } from "@/lib/api/mock-guard";
import { list, buildPagination } from "@/lib/api/response";

const MOCK_PROJECTS = [
  {
    id: "1",
    slug: "sao-ke-magazine",
    title: "Sao Kê Magazine",
    titleVi: "Tạp chí Sao Kê",
    client: "Sao Ke Media",
    category: "web",
    description: "Website tạp chí với hệ thống bài viết, tải về PDF.",
    thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    isPublished: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "greenlife-ecommerce",
    title: "GreenLife E-Commerce",
    titleVi: "Cửa hàng GreenLife",
    client: "GreenLife VN",
    category: "ecommerce",
    description: "Website bán hàng nông sản hữu cơ với thanh toán online.",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
    isPublished: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    slug: "techstart-vietnam",
    title: "TechStart Vietnam",
    titleVi: "TechStart Vietnam",
    client: "TechStart Corp",
    category: "web",
    description: "Landing page giới thiệu startup công nghệ.",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    isPublished: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    slug: "bloom-cafe",
    title: "Bloom Café",
    titleVi: "Bloom Café",
    client: "Bloom Café VN",
    category: "web",
    description: "Website giới thiệu và đặt bàn cho quán cà phê.",
    thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd0b64?w=800",
    isPublished: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    slug: "luxstay-booking",
    title: "LuxStay Booking",
    titleVi: "LuxStay Booking",
    client: "LuxStay Properties",
    category: "web",
    description: "Nền tảng đặt phòng khách sạn cao cấp.",
    thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    isPublished: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    slug: "smartedu-platform",
    title: "SmartEdu Platform",
    titleVi: "Nền tảng SmartEdu",
    client: "SmartEdu JSC",
    category: "app",
    description: "Nền tảng học trực tuyến với video, quiz, certification.",
    thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800",
    isPublished: false,
    sortOrder: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    slug: "fitlife-gym",
    title: "FitLife Gym",
    titleVi: "FitLife Gym",
    client: "FitLife Fitness",
    category: "web",
    description: "Website phòng gym với hệ thống đặt lịch tập.",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    isPublished: true,
    sortOrder: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    slug: "vinhomes-portal",
    title: "Vinhomes Resident Portal",
    titleVi: "Cổng cư dân Vinhomes",
    client: "Vinhomes JSC",
    category: "web",
    description: "Cổng thông tin cư dân thông minh cho khu đô thị.",
    thumbnail: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    isPublished: true,
    sortOrder: 8,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const search = (searchParams.get("search") ?? "").toLowerCase();

  let filtered = MOCK_PROJECTS;
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.client?.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return list(paginated, buildPagination(page, limit, total));
}
