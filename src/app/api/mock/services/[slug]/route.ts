/**
 * Mock Service by Slug — used when NEXT_PUBLIC_MOCK_API=true
 */

import { requireMockApi } from "@/lib/api/mock-guard";
import { ok, notFound, serverError } from "@/lib/api/response";
import type { NextRequest } from "next/server";

// Minimal mock data for single-service lookup (slug-based)
const MOCK_SERVICE_DETAILS: Record<string, object> = {
  "website-design": {
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
    attributes: [
      { id: "a1", name: "Số lượng trang", tier: "basic", price: 0 },
      { id: "a2", name: "Trang đích (Landing)", tier: "basic", price: 0 },
      { id: "a3", name: "Tên miền quốc tế (.com)", tier: "add-on", price: 350000 },
    ],
  },
  "mobile-app": {
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
    attributes: [],
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  try {
    const { slug } = await params;
    const service = MOCK_SERVICE_DETAILS[slug];
    if (!service) return notFound("Service not found");
    return ok(service);
  } catch (error) {
    console.error("Mock service error:", error);
    return serverError();
  }
}
