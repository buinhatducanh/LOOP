/**
 * Mock Services API — used when NEXT_PUBLIC_MOCK_API=true
 * Returns realistic dummy data for FE development.
 */

import { requireMockApi } from "@/lib/api/mock-guard"
import { list, buildPagination } from "@/lib/api/response"
import type { NextRequest } from "next/server"

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_SERVICES = [
  {
    id: "1",
    slug: "website-design",
    title: "Thiết kế Website",
    titleVi: "Thiết kế Website",
    category: "design",
    icon: "🎨",
    price: 5000000,
    description: "Thiết kế website chuyên nghiệp, responsive trên mọi thiết bị.",
    descriptionVi: "Thiết kế website chuyên nghiệp, responsive trên mọi thiết bị.",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "2",
    slug: "mobile-app",
    title: "Ứng dụng di động",
    titleVi: "Ứng dụng di động",
    category: "development",
    icon: "📱",
    price: 15000000,
    description: "Phát triển ứng dụng iOS & Android native hoặc cross-platform.",
    descriptionVi: "Phát triển ứng dụng iOS & Android native hoặc cross-platform.",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "3",
    slug: "seo-optimization",
    title: "Tối ưu SEO",
    titleVi: "Tối ưu SEO",
    category: "marketing",
    icon: "🔍",
    price: 3000000,
    description: "Tối ưu website cho công cụ tìm kiếm, tăng thứ hạng Google.",
    descriptionVi: "Tối ưu website cho công cụ tìm kiếm, tăng thứ hạng Google.",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "4",
    slug: "branding-identity",
    title: "Nhận diện thương hiệu",
    titleVi: "Nhận diện thương hiệu",
    category: "design",
    icon: "✨",
    price: 8000000,
    description: "Thiết kế logo, bộ nhận diện thương hiệu chuyên nghiệp.",
    descriptionVi: "Thiết kế logo, bộ nhận diện thương hiệu chuyên nghiệp.",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "5",
    slug: "digital-marketing",
    title: "Marketing số",
    titleVi: "Marketing số",
    category: "marketing",
    icon: "📈",
    price: 6000000,
    description: "Chiến dịch quảng cáo Google Ads, Facebook Ads hiệu quả.",
    descriptionVi: "Chiến dịch quảng cáo Google Ads, Facebook Ads hiệu quả.",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "6",
    slug: "hosting-maintenance",
    title: "Hosting & Bảo trì",
    titleVi: "Hosting & Bảo trì",
    category: "maintenance",
    icon: "🛡️",
    price: 1200000,
    description: "Dịch vụ hosting, bảo trì website hàng tháng.",
    descriptionVi: "Dịch vụ hosting, bảo trì website hàng tháng.",
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "7",
    slug: "ecommerce",
    title: "Website thương mại điện tử",
    titleVi: "Website thương mại điện tử",
    category: "development",
    icon: "🛒",
    price: 20000000,
    description: "Xây dựng website bán hàng online đầy đủ tính năng.",
    descriptionVi: "Xây dựng website bán hàng online đầy đủ tính năng.",
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "8",
    slug: "content-writing",
    title: "Viết content",
    titleVi: "Viết content",
    category: "marketing",
    icon: "✍️",
    price: 1000000,
    description: "Dịch vụ viết bài chuẩn SEO, content marketing.",
    descriptionVi: "Dịch vụ viết bài chuẩn SEO, content marketing.",
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "9",
    slug: "analytics-reporting",
    title: "Phân tích & Báo cáo",
    titleVi: "Phân tích & Báo cáo",
    category: "analytics",
    icon: "📊",
    price: 2500000,
    description: "Theo dõi, phân tích dữ liệu website và tối ưu hiệu quả.",
    descriptionVi: "Theo dõi, phân tích dữ liệu website và tối ưu hiệu quả.",
    isActive: true,
    sortOrder: 9,
  },
  {
    id: "10",
    slug: "crm-integration",
    title: "Tích hợp CRM",
    titleVi: "Tích hợp CRM",
    category: "development",
    icon: "🔗",
    price: 10000000,
    description: "Tích hợp hệ thống CRM, tự động hóa quy trình bán hàng.",
    descriptionVi: "Tích hợp hệ thống CRM, tự động hóa quy trình bán hàng.",
    isActive: true,
    sortOrder: 10,
  },
]

// ─── Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const blocked = requireMockApi()
  if (blocked) return blocked

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)))
  const search = (searchParams.get("search") || "").toLowerCase()
  const category = searchParams.get("category") || ""

  let filtered = MOCK_SERVICES
  if (search) {
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(search) ||
        s.titleVi.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search)
    )
  }
  if (category) {
    filtered = filtered.filter((s) => s.category === category)
  }

  const total = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  return list(paginated, buildPagination(page, limit, total))
}
