import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ROLE_LEVEL, AUTH_COOKIES } from "@/lib/auth/roles";
import { applyRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/auth/audit";

const DUMMY_HASH = "$2a$12$LJ3m4ys3Rl3hPcyFSevMnuGHvZw7KLEqKl6.s8EWYFONbJdRe0Gu2";

export async function POST(_req: NextRequest) {
  const rateLimitResult = await applyRateLimit(req, "auth");
  if (!rateLimitResult.allowed) return rateLimitResult.response!;

  // Track userId for audit logging in catch block
  let auditUserId: string | null = null;

  try {
    // Handle both JSON and form-encoded bodies (NextAuth sends form-encoded)
    let email: string | undefined;
    let password: string | undefined;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body.email;
      password = body.password;
    } else {
      // Form-encoded or multipart
      const formData = await req.formData();
      email = formData.get("email") as string | undefined;
      password = formData.get("password") as string | undefined;
    }

    if (!email || !password) {
      const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "vi";
      return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=missing`, req.url), 302);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, passwordHash: true, name: true,
        role: true, isActive: true, teamMemberId: true, isOnboarded: true,
        userRoles: {
          select: { role: { select: { name: true, level: true } } },
        },
        teamMember: { select: { accessTags: true, rank: true, availableLp: true } },
      },
    });

    if (user) auditUserId = user.id;

    const valid = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !valid) {
      const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "vi";
      return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=invalid`, req.url), 302);
    }

    if (!user.isActive) {
      const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "vi";
      return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=disabled`, req.url), 302);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const roleLevel = user.userRoles.length > 0
      ? Math.min(...user.userRoles.map((ur) => ur.role.level ?? 99))
      : ROLE_LEVEL[user.role] ?? 99;
    const accountType: "staff" | "customer" = roleLevel <= 5 ? "staff" : "customer";

    const ipAddress = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { accessToken, refreshToken } = await createSession(
      user.id,
      {
        roleLevel,
        email: user.email,
        name: user.name,
        role: user.role,
        roles,
        accessTags: user.teamMember?.accessTags ?? [],
        accountType,
        isOnboarded: user.isOnboarded,
        rank: user.teamMember?.rank,
        availableLp: user.teamMember?.availableLp,
      },
      { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined }
    );

    // Role-based redirect: staff → admin dashboard, customer → customer portal
    const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "vi";
    const redirectPath = accountType === "staff" || roleLevel <= 5
      ? "/admin/overview"
      : `/${locale}/khach-hang`;

    // Custom redirect HTML: sets localStorage THEN redirects.
    // This is needed because HttpOnly cookies can't be read by JS,
    // but apiClient needs localStorage for Bearer token.
    const localStorageScript = `
      try {
        localStorage.setItem("${accountType === "staff" ? "loop-staff-token" : "loop-customer-token"}", ${JSON.stringify(accessToken)});
      } catch(e) {}
    `;
    const redirectHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><script>${localStorageScript}window.location="${redirectPath}";<\/script></head><body></body></html>`;

    const response = new NextResponse(redirectHtml, {
      status: 302,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Location": redirectPath,
      },
    });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Split auth (Option C): set the correct token cookie by account type
    if (accountType === "staff") {
      response.cookies.set("loop-staff-token", accessToken, { ...cookieOpts, maxAge: 15 * 60 });
      // Clear customer token on staff login
      response.cookies.set("loop-customer-token", "", { ...cookieOpts, maxAge: 0 });
    } else {
      response.cookies.set("loop-customer-token", accessToken, { ...cookieOpts, maxAge: 15 * 60 });
      // Clear staff token on customer login
      response.cookies.set("loop-staff-token", "", { ...cookieOpts, maxAge: 0 });
    }

    // Also set legacy auth-token for backward compat
    response.cookies.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, { ...cookieOpts, maxAge: 15 * 60 });

    // Refresh token cookie (7 days)
    response.cookies.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set(AUTH_COOKIES.AUTH_METHOD, "credentials", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    response.cookies.set(AUTH_COOKIES.LOGGED_IN, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Audit log on success (fire-and-forget, don't block redirect)
    await createAuditLog({ userId: user.id, action: "login_success", resource: "auth" })
      .catch(() => {/* ignore */});

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[login-redirect] POST error:", msg);
    // Audit log on failure
    if (auditUserId) {
      await createAuditLog({ userId: auditUserId, action: "login_failed", resource: "auth" })
        .catch(() => {/* ignore */});
    }
    const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "vi";
    return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=server`, req.url), 302);
  }
}
