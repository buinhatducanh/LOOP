/**
 * Mock Pricing API — used when NEXT_PUBLIC_MOCK_API=true
 */

import { NextRequest } from "next/server";
import { requireMockApi } from "@/lib/api/mock-guard";
import { list } from "@/lib/api/response";

const MOCK_PRICING_FEATURES = [
  // Giao diện
  { id: "f1", name: "Mẫu tiêu chuẩn, chuẩn Responsive", nameVi: "Mẫu tiêu chuẩn, chuẩn Responsive", category: "Giao diện", tier: "basic", price: 2890000, xpPoints: 144 },
  { id: "f2", name: "Tùy chỉnh màu sắc, bộ lọc cơ bản", nameVi: "Tùy chỉnh màu sắc, bộ lọc cơ bản", category: "Giao diện", tier: "basic", price: 4890000, xpPoints: 244 },
  { id: "f3", name: "Tối ưu UX Checkout, Animation, Mega Menu", nameVi: "Tối ưu UX Checkout, Animation, Mega Menu", category: "Giao diện", tier: "advanced", price: 6890000, xpPoints: 344 },
  { id: "f4", name: "Giao diện độc quyền, NextJS SSR/SSG", nameVi: "Giao diện độc quyền, NextJS SSR/SSG", category: "Giao diện", tier: "premium", price: 10890000, xpPoints: 544 },
  // Hosting
  { id: "f5", name: "Hosting Cơ bản (2GB)", nameVi: "Hosting Cơ bản (2GB)", category: "Hosting", tier: "basic", price: 800000, xpPoints: 40 },
  { id: "f6", name: "Hosting Nâng cao (5GB)", nameVi: "Hosting Nâng cao (5GB)", category: "Hosting", tier: "advanced", price: 1800000, xpPoints: 90 },
  { id: "f7", name: "Hosting Premium (10GB)", nameVi: "Hosting Premium (10GB)", category: "Hosting", tier: "premium", price: 3000000, xpPoints: 150 },
  // Marketing
  { id: "f8", name: "Mã giảm giá chung, phí ship đồng giá", nameVi: "Mã giảm giá chung, phí ship đồng giá", category: "Marketing", tier: "basic", price: 2000000, xpPoints: 100 },
  { id: "f9", name: "Flash Sale, Combo discount", nameVi: "Flash Sale, Combo discount", category: "Marketing", tier: "advanced", price: 4000000, xpPoints: 200 },
  { id: "f10", name: "Tích điểm đổi quà, Credit system", nameVi: "Tích điểm đổi quà, Credit system", category: "Marketing", tier: "premium", price: 8000000, xpPoints: 400 },
];

export async function GET(req: NextRequest) {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  return list(MOCK_PRICING_FEATURES, { page: 1, limit: 100, total: MOCK_PRICING_FEATURES.length, totalPages: 1 });
}
