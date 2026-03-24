import { NextResponse } from "next/server";
import { getServices } from "@/lib/db/queries";

export async function GET() {
  try {
    const services = await getServices();

    // Group services by category for navbar dropdowns
    const grouped: Record<string, typeof services> = {};
    for (const service of services) {
      const cat = service.category ?? "Khác";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    }

    return NextResponse.json({
      data: services,
      grouped,
      categories: Object.keys(grouped),
    });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
