import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * LP Redemption for Customers
 *
 * Customers spend CustomerPoint.balance to redeem rewards.
 * Rewards come from AddonService where lpCost != null.
 *
 * Flow:
 *   1. Validate session → get customer account
 *   2. Load redeemable catalog (AddonService.lpCost != null)
 *   3. On POST redeem: atomic deduct + PointTransaction(type=spend)
 */

// ── GET: List redeemable catalog ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const catalog = searchParams.get("catalog") === "1";

    // ── Redeemable catalog (public, no auth needed) ─────────────────────────
    if (catalog) {
      const items = await prisma.addonService.findMany({
        where: {
          isActive: true,
          lpCost: { not: null },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          nameVi: true,
          description: true,
          descriptionVi: true,
          icon: true,
          type: true,
          lpCost: true,
          billingPeriod: true,
        },
        orderBy: { lpCost: "asc" },
      });
      // Filter + cast: where lpCost is not null guarantees non-null
      const redeemable = items.filter(
        (i): i is typeof i & { lpCost: number } => i.lpCost !== null
      );
      return NextResponse.json({ data: redeemable });
    }

    // ── Customer account (requires email) ─────────────────────────────────
    const userEmail = session?.user?.email || email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    let customerPoint = await prisma.customerPoint.findUnique({
      where: { userEmail },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!customerPoint) {
      customerPoint = await prisma.customerPoint.create({
        data: {
          userEmail,
          userName: session?.user?.name || null,
          userId: session?.user?.id || null,
        },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    }

    // Redeemable items (filtered for customer's LP balance)
    const redeemableItems = await prisma.addonService.findMany({
      where: {
        isActive: true,
        lpCost: { not: null },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        nameVi: true,
        description: true,
        descriptionVi: true,
        icon: true,
        type: true,
        lpCost: true,
        billingPeriod: true,
      },
      orderBy: { lpCost: "asc" },
    });

    const items = redeemableItems.filter(
      (i): i is typeof i & { lpCost: number } =>
        i.lpCost !== null && i.lpCost <= customerPoint!.balance
    );
    const expensiveItems = redeemableItems.filter(
      (i): i is typeof i & { lpCost: number } =>
        i.lpCost !== null && i.lpCost > customerPoint!.balance
    );

    const activities = await prisma.pointActivity.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const ads = await prisma.advertisement.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const dailyRewards = await prisma.dailyReward.findMany({
      where: { isActive: true },
      orderBy: { day: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayAdWatches, lastAdWatch] = await Promise.all([
      prisma.adWatchHistory.count({
        where: { customerPointId: customerPoint.id, watchedAt: { gte: today } },
      }),
      prisma.adWatchHistory.findFirst({
        where: { customerPointId: customerPoint.id },
        orderBy: { watchedAt: "desc" },
      }),
    ]);

    let cooldownRemaining = 0;
    if (lastAdWatch) {
      const cooldownEnd = new Date(lastAdWatch.watchedAt);
      cooldownEnd.setSeconds(cooldownEnd.getSeconds() + 3600);
      if (cooldownEnd > new Date()) {
        cooldownRemaining = Math.floor((cooldownEnd.getTime() - Date.now()) / 1000);
      }
    }

    return NextResponse.json({
      data: {
        points: customerPoint,
        redeemable: items,
        locked: expensiveItems,
        activities,
        ads,
        dailyRewards,
        todayAdWatches,
        cooldownRemaining,
      },
    });
  } catch (error) {
    console.error("Error fetching points:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// ── POST: Earn or Redeem ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { action, adId, addonId, quantity, email } = body;
    const userEmail = session.user.email;

    // ── Get or create customer point account ────────────────────────────────
    let customerPoint = await prisma.customerPoint.findUnique({
      where: { userEmail },
    });

    if (!customerPoint) {
      customerPoint = await prisma.customerPoint.create({
        data: {
          userEmail,
          userName: session.user.name || null,
          userId: session.user.id || null,
        },
      });
    }

    // ── Redeem LP ─────────────────────────────────────────────────────────
    if (action === "redeem") {
      if (!addonId) {
        return NextResponse.json({ error: "Thiếu addonId" }, { status: 400 });
      }

      // Load the AddonService (read-only, outside tx — safe)
      const addon = await prisma.addonService.findUnique({
        where: { id: addonId },
        select: {
          id: true,
          name: true,
          nameVi: true,
          slug: true,
          lpCost: true,
          type: true,
          isActive: true,
          billingPeriod: true,
        },
      });

      if (!addon) {
        return NextResponse.json({ error: "Dịch vụ không tồn tại" }, { status: 404 });
      }

      if (!addon.isActive) {
        return NextResponse.json({ error: "Dịch vụ hiện không khả dụng" }, { status: 400 });
      }

      if (addon.lpCost === null || addon.lpCost <= 0) {
        return NextResponse.json({ error: "Dịch vụ này không thể đổi bằng LP" }, { status: 400 });
      }

      const qty = Math.max(1, Number(quantity ?? 1));
      const totalCost = addon.lpCost * qty;

      // Determine expiry
      let expiresAt: Date | null = null;
      if (addon.type === "recurring") {
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + qty);
      }

      // Atomic: re-read balance inside tx to prevent race-condition double-spend
      const updated = await prisma.$transaction(async (tx) => {
        // Re-read balance inside the transaction — prevents TOCTOU race
        const fresh = await tx.customerPoint.findUnique({
          where: { id: customerPoint.id },
          select: { balance: true },
        });
        if (!fresh) throw new Error("Customer point account not found");

        if (fresh.balance < totalCost) {
          throw new Error(`Số dư không đủ: cần ${totalCost} LP, bạn có ${fresh.balance} LP`);
        }

        const newBalance = fresh.balance - totalCost;

        await tx.customerPoint.update({
          where: { id: customerPoint.id },
          data: { balance: newBalance, totalSpent: { increment: totalCost } },
        });

        await tx.pointTransaction.create({
          data: {
            customerPointId: customerPoint.id,
            type: "spend",
            amount: -totalCost,
            source: "redeem",
            description: `Đổi ${qty}× ${addon.nameVi ?? addon.name} — ${totalCost} LP`,
            referenceId: addon.id,
            referenceType: "AddonService",
            status: "completed",
            expiresAt,
          },
        });

        return newBalance;
      });

      return NextResponse.json({
        success: true,
        action: "redeem",
        item: { id: addon.id, name: addon.nameVi ?? addon.name, slug: addon.slug },
        quantity: qty,
        totalCost,
        newBalance: updated,
      });
    }

    // ── Daily login ─────────────────────────────────────────────────────
    if (action === "daily_login") {
      // All reads and writes inside transaction — prevents concurrent login bonus abuse
      const result = await prisma.$transaction(async (tx) => {
        const fresh = await tx.customerPoint.findUnique({
          where: { id: customerPoint.id },
          select: { lastLoginDate: true, loginStreak: true, level: true, currentXp: true, balance: true, totalEarned: true },
        });
        if (!fresh) throw new Error("Customer point account not found");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (fresh.lastLoginDate) {
          const lastLogin = new Date(fresh.lastLoginDate);
          lastLogin.setHours(0, 0, 0, 0);
          if (lastLogin.getTime() === today.getTime()) {
            throw new Error("ALREADY_CLAIMED");
          }
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastLogin = fresh.lastLoginDate ? new Date(fresh.lastLoginDate) : null;
        lastLogin?.setHours(0, 0, 0, 0);

        let newStreak = fresh.loginStreak;
        if (lastLogin && lastLogin.getTime() === yesterday.getTime()) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        const dailyReward = await tx.dailyReward.findUnique({
          where: { day: Math.min(newStreak, 7) },
        });

        const pointsEarned = dailyReward?.points ?? 10;
        const xpEarned = dailyReward?.xpBonus ?? 1;
        const xpNeeded = fresh.level * 100;

        let newLevel = fresh.level;
        let newCurrentXp = fresh.currentXp + xpEarned;
        if (newCurrentXp >= xpNeeded) {
          newLevel += 1;
          newCurrentXp -= xpNeeded;
        }

        await tx.customerPoint.update({
          where: { id: customerPoint.id },
          data: {
            loginStreak: newStreak,
            lastLoginDate: today,
            balance: { increment: pointsEarned },
            totalEarned: { increment: pointsEarned },
            level: newLevel,
            currentXp: newCurrentXp,
          },
        });

        await tx.pointTransaction.create({
          data: {
            customerPointId: customerPoint.id,
            type: "earn",
            amount: pointsEarned,
            source: "daily_login",
            description: `Điểm thưởng đăng nhập ngày thứ ${newStreak}`,
            referenceId: null,
            referenceType: null,
            status: "completed",
          },
        });

        return { pointsEarned, xpEarned, newBalance: fresh.balance + pointsEarned, loginStreak: newStreak, level: newLevel };
      });

      return NextResponse.json({
        success: true,
        action: "daily_login",
        pointsEarned: result.pointsEarned,
        xpEarned: result.xpEarned,
        newBalance: result.newBalance,
        loginStreak: result.loginStreak,
        level: result.level,
      });
    }

    // ── Watch ad ──────────────────────────────────────────────────────────
    if (action === "watch_ad") {
      if (!adId) {
        return NextResponse.json({ error: "Thiếu ID quảng cáo" }, { status: 400 });
      }

      // Load ad outside tx (read-only)
      const ad = await prisma.advertisement.findUnique({ where: { id: adId } });
      if (!ad) {
        return NextResponse.json({ error: "Quảng cáo không tồn tại" }, { status: 404 });
      }

      // All reads + writes inside transaction — prevents concurrent ad-watch abuse
      const result = await prisma.$transaction(async (tx) => {
        // Re-read last watch inside tx for cooldown check
        const lastWatch = await tx.adWatchHistory.findFirst({
          where: { customerPointId: customerPoint.id },
          orderBy: { watchedAt: "desc" },
        });

        if (lastWatch) {
          const cooldownEnd = new Date(lastWatch.watchedAt);
          cooldownEnd.setSeconds(cooldownEnd.getSeconds() + ad.watchCooldown);
          if (cooldownEnd > new Date()) {
            throw new Error(`COOLDOWN:${Math.floor((cooldownEnd.getTime() - Date.now()) / 1000)}`);
          }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayWatches = await tx.adWatchHistory.count({
          where: { customerPointId: customerPoint.id, watchedAt: { gte: today } },
        });

        if (todayWatches >= ad.dailyLimit) {
          throw new Error("LIMIT_REACHED");
        }

        // Re-read point record inside tx for level check + XP
        const fresh = await tx.customerPoint.findUnique({
          where: { id: customerPoint.id },
          select: { level: true, currentXp: true, balance: true, totalEarned: true },
        });
        if (!fresh) throw new Error("Customer point account not found");

        if (fresh.level < ad.minLevel) {
          throw new Error(`LEVEL_REQUIRED:${ad.minLevel}`);
        }

        const xpNeeded = fresh.level * 100;
        let newLevel = fresh.level;
        let newCurrentXp = fresh.currentXp + ad.xpBonus;
        if (newCurrentXp >= xpNeeded) {
          newLevel += 1;
          newCurrentXp -= xpNeeded;
        }

        await tx.customerPoint.update({
          where: { id: customerPoint.id },
          data: {
            balance: { increment: ad.points },
            totalEarned: { increment: ad.points },
            level: newLevel,
            currentXp: newCurrentXp,
          },
        });

        await tx.adWatchHistory.create({
          data: {
            customerPointId: customerPoint.id,
            advertisementId: ad.id,
            adSlug: ad.slug,
            pointsEarned: ad.points,
            xpEarned: ad.xpBonus,
            completed: true,
            watchDuration: ad.duration,
          },
        });

        await tx.pointTransaction.create({
          data: {
            customerPointId: customerPoint.id,
            type: "earn",
            amount: ad.points,
            source: "watch_ad",
            description: `Xem quảng cáo: ${ad.titleVi}`,
            referenceId: ad.id,
            referenceType: "advertisement",
            status: "completed",
          },
        });

        return { newBalance: fresh.balance + ad.points, newLevel, cooldownRemaining: ad.watchCooldown };
      });

      return NextResponse.json({
        success: true,
        action: "watch_ad",
        pointsEarned: ad.points,
        xpEarned: ad.xpBonus,
        newBalance: result.newBalance,
        level: result.newLevel,
        cooldownRemaining: result.cooldownRemaining,
      });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    // Typed error codes from atomic actions
    if (msg === "ALREADY_CLAIMED") {
      return NextResponse.json({ error: "Đã nhận thưởng đăng nhập hôm nay" }, { status: 400 });
    }
    if (msg === "LIMIT_REACHED") {
      return NextResponse.json({ error: "Đã hết lượt xem hôm nay" }, { status: 400 });
    }
    if (msg.startsWith("COOLDOWN:")) {
      return NextResponse.json({
        error: "Vui lòng chờ",
        cooldownRemaining: parseInt(msg.split(":")[1]),
      }, { status: 400 });
    }
    if (msg.startsWith("LEVEL_REQUIRED:")) {
      return NextResponse.json({
        error: `Cần đạt cấp ${msg.split(":")[1]} để xem quảng cáo này`,
      }, { status: 400 });
    }
    if (msg.startsWith("Số dư không đủ")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("Error processing point action:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
