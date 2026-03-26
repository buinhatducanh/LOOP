import { ok, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

// Public API: Trả về dữ liệu cho trang "Mô hình Cung cấp Dịch vụ Website Kép"
export async function GET() {
  try {
    const [templates, attributes] = await Promise.all([
      // Luồng 1: Kho giao diện (Web Gói)
      prisma.webTemplate.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          bundledAttributes: {
            include: {
              attribute: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  nameVi: true,
                  icon: true,
                  category: true,
                  categoryVi: true,
                },
              },
            },
          },
        },
      }),
      // Luồng 2: Kho tính năng (Web Thiết Kế Theo Yêu Cầu)
      prisma.serviceAttribute.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      }),
    ]);

    return ok({ templates, attributes });
  } catch (error) {
    console.error("Failed to fetch dual-services:", error);
    return serverError();
  }
}
