/**
 * POST /api/admin/auth/client-onboarding
 *
 * Completes customer onboarding profile:
 *   - Sets isOnboarded = true
 *   - Updates profile fields: phone, dateOfBirth, companyName, businessType, address, taxCode
 *   - Returns updated JWT with isOnboarded flag + sets refresh-token cookie
 *
 * Auth: Bearer token (customer's own JWT)
 * Guard: Only customers (accountType = "customer") can call this.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorToResponse } from "@/lib/auth/permissions";
import { ok, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { AUTH_COOKIES } from "@/lib/auth/roles";

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

    // Re-fetch user to get full session data (roles, teamMember)
    const [updated, freshUser] = await Promise.all([
      prisma.user.update({
        where: { id: session.userId },
        data: updateData,
        select: {
          id: true, email: true, name: true, phone: true, companyName: true,
          businessType: true, dateOfBirth: true, address: true, taxCode: true,
          isOnboarded: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          role: true, accountType: true, teamMemberId: true,
          userRoles: {
            select: { role: { select: { name: true, level: true } } },
          },
          teamMember: { select: { accessTags: true, rank: true, availableLp: true } },
        },
      }),
    ]);

    if (!freshUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const roles = freshUser.userRoles.map((ur) => ur.role.name);
    const roleLevel = freshUser.userRoles.length > 0
      ? Math.min(...freshUser.userRoles.map((ur) => ur.role.level ?? 99))
      : 5;

    const ipAddress = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { accessToken, refreshToken } = await createSession(
      updated.id,
      {
        roleLevel,
        email: updated.email,
        name: updated.name,
        role: freshUser.role,
        roles,
        accessTags: freshUser.teamMember?.accessTags ?? [],
        accountType: freshUser.accountType as "staff" | "customer",
        isOnboarded: true,
        rank: freshUser.teamMember?.rank,
        availableLp: freshUser.teamMember?.availableLp,
      },
      { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined }
    );

    const response = ok({ user: updated, token: accessToken });

    response.cookies.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
    response.cookies.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    return authErrorToResponse(err);
  }
}
