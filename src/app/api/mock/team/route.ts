/**
 * Mock Team API — used when NEXT_PUBLIC_MOCK_API=true
 */

import { NextRequest } from "next/server";
import { requireMockApi } from "@/lib/api/mock-guard";
import { list, buildPagination } from "@/lib/api/response";

const MOCK_TEAM = [
  { id: "1", slug: "nguyen-van-a", name: "Nguyen Van A", role: "CEO", roleLevel: -1, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", xp: 5000, rank: "diamond", isWorking: true, isActive: true, sortOrder: 1 },
  { id: "2", slug: "tran-thi-b", name: "Tran Thi B", role: "CTO", roleLevel: 0, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", xp: 4200, rank: "diamond", isWorking: true, isActive: true, sortOrder: 2 },
  { id: "3", slug: "le-van-c", name: "Le Van C", role: "Project Manager", roleLevel: 2, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", xp: 3500, rank: "platinum", isWorking: true, isActive: true, sortOrder: 3 },
  { id: "4", slug: "pham-thi-d", name: "Pham Thi D", role: "Lead Designer", roleLevel: 2, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", xp: 2800, rank: "gold", isWorking: true, isActive: true, sortOrder: 4 },
  { id: "5", slug: "hoang-van-e", name: "Hoang Van E", role: "Senior Developer", roleLevel: 3, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", xp: 2100, rank: "gold", isWorking: true, isActive: true, sortOrder: 5 },
  { id: "6", slug: "vu-thi-f", name: "Vu Thi F", role: "QA Engineer", roleLevel: 4, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", xp: 1500, rank: "silver", isWorking: true, isActive: true, sortOrder: 6 },
  { id: "7", slug: "dang-van-g", name: "Dang Van G", role: "Marketing Lead", roleLevel: 3, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", xp: 1800, rank: "silver", isWorking: true, isActive: true, sortOrder: 7 },
  { id: "8", slug: "bui-thi-h", name: "Bui Thi H", role: "Frontend Developer", roleLevel: 3, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200", xp: 1200, rank: "bronze", isWorking: true, isActive: true, sortOrder: 8 },
  { id: "9", slug: "do-van-i", name: "Do Van I", role: "Backend Developer", roleLevel: 3, avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200", xp: 1000, rank: "bronze", isWorking: true, isActive: true, sortOrder: 9 },
  { id: "10", slug: "chu-thi-k", name: "Chu Thi K", role: "Content Writer", roleLevel: 4, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200", xp: 800, rank: "bronze", isWorking: false, isActive: true, sortOrder: 10 },
];

export async function GET(req: NextRequest) {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const search = (searchParams.get("search") ?? "").toLowerCase();

  let filtered = MOCK_TEAM;
  if (search) {
    filtered = filtered.filter(
      (m) => m.name.toLowerCase().includes(search) || m.role?.toLowerCase().includes(search)
    );
  }

  return list(filtered, buildPagination(page, limit, filtered.length));
}
