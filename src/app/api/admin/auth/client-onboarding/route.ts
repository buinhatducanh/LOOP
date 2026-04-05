/**
 * POST /api/admin/auth/client-onboarding
 *
 * Completes customer onboarding profile:
 *   - Sets isOnboarded = true
 *   - Updates profile fields: phone, dateOfBirth, companyName, businessType, address, taxCode
 *   - Returns updated JWT with isOnboarded flag
 *
 * Auth: Bearer token (customer's own JWT)
 * Guard: Only customers (accountType = "customer") can call this.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, handleError, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";

const VALID_BUSINESS_TYPES = [
  "technology", "retail", "finance", "healthcare",
  "education", "food", "real_estate", "manufacturing",
  "services", "marketing", "other",
];

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // ── Only customers can use this endpoint ─────────────────────────────────────
    if (session.accountType !== "customer") {
      return NextResponse.json(
        { error: "Chỉ tài khoản khách hàng mới cần hoàn tất hồ sơ" },
        { status: 403 }
      );
    }

    // Already onboarded
    if (session.isOnboarded === true) {
      return NextResponse.json(
        { error: "Hồ sơ đã được hoàn tất trước đó" },
        { status: 409 }
      );
    }

    const body = await req.json();
    const {
      phone,
      dateOfBirth,
      companyName,
      businessType,
      address,
      taxCode,
    } = body;

    // ── Validation ───────────────────────────────────────────────────────────────
    if (phone !== undefined && typeof phone === "string" && phone.length > 0) {
      // Basic phone: digits, spaces, dashes, + prefix, 8-15 chars
      const phoneRegex = /^[+\d][\d\s\-]{7,14}$/;
      if (!phoneRegex.test(phone.trim())) {
        return badRequest("Số điện thoại không hợp lệ");
      }
    }

    if (businessType && typeof businessType === "string") {
      if (!VALID_BUSINESS_TYPES.includes(businessType)) {
        return badRequest("Loại hình kinh doanh không hợp lệ");
      }
    }

    if (dateOfBirth && typeof dateOfBirth === "string") {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return badRequest("Ngày sinh không hợp lệ");
      }
      if (dob > new Date()) {
        return badRequest("Ngày sinh không thể là ngày trong tương lai");
      }
    }

    if (taxCode && typeof taxCode === "string" && taxCode.length > 0) {
      if (!/^[\d\-\.]+$/.test(taxCode)) {
        return badRequest("Mã số thuế không hợp lệ (chỉ chứa số, dấu gạch ngang và dấu chấm)");
      }
    }

    // ── Update User profile ────────────────────────────────────────────────────
    const updateData: Record<string, unknown> = {
      isOnboarded: true,
    };

    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (companyName !== undefined) updateData.companyName = companyName?.trim() || null;
    if (businessType !== undefined) updateData.businessType = businessType || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (taxCode !== undefined) updateData.taxCode = taxCode?.trim() || null;

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true, email: true, name: true, phone: true, companyName: true,
        businessType: true, dateOfBirth: true, address: true, taxCode: true,
        isOnboarded: true,
      },
    });

    // ── Issue new JWT with isOnboarded = true ──────────────────────────────────
    // Preserve the user's actual role from the session — do not hardcode.
    // The accountType guard above already ensures only customers reach this.
    const token = signToken({
      userId: updated.id,
      email: updated.email,
      role: session.role,
      roles: session.roles,
      roleLevel: session.roleLevel,
      accountType: "customer",
      isOnboarded: true,
    });

    return ok({ user: updated, token });
  } catch (err) {
    return handleError(err);
  }
}
