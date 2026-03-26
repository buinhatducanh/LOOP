/**
 * Mock Dashboard API — used when NEXT_PUBLIC_MOCK_API=true
 */

import { requireMockApi } from "@/lib/api/mock-guard";
import { ok } from "@/lib/api/response";

export async function GET() {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  return ok({
    stats: {
      totalOrders: 127,
      pendingOrders: 14,
      completedOrders: 98,
      totalRevenue: 1_234_567_000,
      activeProjects: 23,
      totalClients: 89,
      teamMembers: 12,
    },
    recentOrders: [
      { id: "1", orderNumber: "ORD-A1B2C3D4E5F6", customerName: "Nguyen Van A", totalAmount: 8500000, status: "pending", createdAt: new Date().toISOString() },
      { id: "2", orderNumber: "ORD-G7H8I9J0K1L2", customerName: "Tran Thi B", totalAmount: 12500000, status: "confirmed", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "3", orderNumber: "ORD-M3N4O5P6Q7R8", customerName: "Le Van C", totalAmount: 5200000, status: "completed", createdAt: new Date(Date.now() - 172800000).toISOString() },
    ],
    kpi: {
      conversionRate: 0.32,
      avgOrderValue: 9720000,
      monthlyGrowth: 0.18,
      customerSatisfaction: 4.7,
    },
    charts: {
      revenueByMonth: [
        { month: "Oct 2025", revenue: 145000000 },
        { month: "Nov 2025", revenue: 198000000 },
        { month: "Dec 2025", revenue: 267000000 },
        { month: "Jan 2026", revenue: 189000000 },
        { month: "Feb 2026", revenue: 312000000 },
        { month: "Mar 2026", revenue: 285000000 },
      ],
      ordersByStatus: [
        { status: "pending", count: 14 },
        { status: "confirmed", count: 8 },
        { status: "in_progress", count: 7 },
        { status: "completed", count: 98 },
      ],
    },
    topMembers: [
      { id: "1", name: "Nguyen Van A", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", xp: 5000, rank: "diamond" },
      { id: "2", name: "Tran Thi B", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", xp: 4200, rank: "diamond" },
      { id: "3", name: "Le Van C", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", xp: 3500, rank: "platinum" },
    ],
  });
}
