import { requireMockApi } from "@/lib/api/mock-guard";
import { list, buildPagination } from "@/lib/api/response";
import type { NextRequest } from "next/server";

const MOCK_ORDERS = [
  {
    id: "1",
    orderNumber: "ORD-001",
    orderType: "web-package",
    customerName: "Nguyễn Văn A",
    customerEmail: "nva@example.com",
    customerPhone: "0901234567",
    companyName: "Công ty A",
    status: "pending",
    paymentStatus: "unpaid",
    totalAmount: 15000000,
    paidAmount: 0,
    package: { title: "Website Chuẩn" },
    createdAt: new Date("2026-03-01").toISOString(),
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    orderType: "custom",
    customerName: "Trần Thị B",
    customerEmail: "ttb@example.com",
    customerPhone: "0912345678",
    status: "contracted",
    paymentStatus: "partial",
    totalAmount: 28000000,
    paidAmount: 14000000,
    package: null,
    createdAt: new Date("2026-03-05").toISOString(),
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    orderType: "web-package",
    customerName: "Lê Văn C",
    customerEmail: "lvc@example.com",
    status: "completed",
    paymentStatus: "paid",
    totalAmount: 8500000,
    paidAmount: 8500000,
    package: { title: "Landing Page" },
    createdAt: new Date("2026-03-10").toISOString(),
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    orderType: "custom",
    customerName: "Phạm Thị D",
    customerEmail: "ptd@example.com",
    status: "pending",
    paymentStatus: "unpaid",
    totalAmount: 45000000,
    paidAmount: 0,
    package: null,
    createdAt: new Date("2026-03-15").toISOString(),
  },
  {
    id: "5",
    orderNumber: "ORD-005",
    orderType: "web-package",
    customerName: "Hoàng Văn E",
    customerEmail: "hve@example.com",
    status: "in_progress",
    paymentStatus: "partial",
    totalAmount: 22000000,
    paidAmount: 11000000,
    package: { title: "Website Premium" },
    createdAt: new Date("2026-03-18").toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const blocked = requireMockApi()
  if (blocked) return blocked

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "10"))
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const paymentStatus = searchParams.get("paymentStatus") || ""

  let filtered = MOCK_ORDERS
  if (search) {
    filtered = filtered.filter(function(o) {
      return o.customerName.toLowerCase().includes(search) ||
        o.orderNumber.toLowerCase().includes(search) ||
        o.customerEmail.toLowerCase().includes(search)
    })
  }
  if (status) {
    filtered = filtered.filter(function(o) { return o.status === status })
  }
  if (paymentStatus) {
    filtered = filtered.filter(function(o) { return o.paymentStatus === paymentStatus })
  }

  const total = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)
  return list(paginated, buildPagination(page, limit, total))
}
