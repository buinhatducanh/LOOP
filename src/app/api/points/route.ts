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

      // Load the AddonService
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

      if (customerPoint.balance < totalCost) {
        return NextResponse.json(
          {
            error: `Số dư không đủ: cần ${totalCost} LP, bạn có ${customerPoint.balance} LP`,
          },
          { status: 400 }
        );
      }

      // Determine expiry
      let expiresAt: Date | null = null;
      if (addon.type === "recurring") {
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + qty);
      }

      // Atomic: deduct balance + create PointTransaction
      const updated = await prisma.$transaction(async (tx) => {
        const newBalance = customerPoint.balance - totalCost;

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (customerPoint.lastLoginDate) {
        const lastLogin = new Date(customerPoint.lastLoginDate);
        lastLogin.setHours(0, 0, 0, 0);

        if (lastLogin.getTime() === today.getTime()) {
          return NextResponse.json({ error: "Đã nhận thưởng đăng nhập hôm nay" }, { status: 400 });
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastLogin.getTime() === yesterday.getTime()) {
          customerPoint.loginStreak += 1;
        } else {
          customerPoint.loginStreak = 1;
        }
      } else {
        customerPoint.loginStreak = 1;
      }

      const dailyReward = await prisma.dailyReward.findUnique({
        where: { day: Math.min(customerPoint.loginStreak, 7) },
      });

      const pointsEarned = dailyReward?.points || 10;
      const xpEarned = dailyReward?.xpBonus || 1;
      const xpNeeded = customerPoint.level * 100;

      customerPoint.balance += pointsEarned;
      customerPoint.totalEarned += pointsEarned;
      customerPoint.currentXp += xpEarned;
      customerPoint.lastLoginDate = new Date();

      if (customerPoint.currentXp >= xpNeeded) {
        customerPoint.level += 1;
        customerPoint.currentXp -= xpNeeded;
      }

      await prisma.customerPoint.update({
        where: { id: customerPoint.id },
        data: customerPoint,
      });

      await prisma.pointTransaction.create({
        data: {
          customerPointId: customerPoint.id,
          type: "earn",
          amount: pointsEarned,
          source: "daily_login",
          description: `Điểm thưởng đăng nhập ngày thứ ${customerPoint.loginStreak}`,
          referenceId: null,
          referenceType: null,
          status: "completed",
        },
      });

      return NextResponse.json({
        success: true,
        action: "daily_login",
        pointsEarned,
        xpEarned,
        newBalance: customerPoint.balance,
        loginStreak: customerPoint.loginStreak,
        level: customerPoint.level,
      });
    }

    // ── Watch ad ──────────────────────────────────────────────────────────
    if (action === "watch_ad") {
      if (!adId) {
        return NextResponse.json({ error: "Thiếu ID quảng cáo" }, { status: 400 });
      }

      const ad = await prisma.advertisement.findUnique({ where: { id: adId } });
      if (!ad) {
        return NextResponse.json({ error: "Quảng cáo không tồn tại" }, { status: 404 });
      }

      const lastWatch = await prisma.adWatchHistory.findFirst({
        where: { customerPointId: customerPoint.id },
        orderBy: { watchedAt: "desc" },
      });

      if (lastWatch) {
        const cooldownEnd = new Date(lastWatch.watchedAt);
        cooldownEnd.setSeconds(cooldownEnd.getSeconds() + ad.watchCooldown);
        if (cooldownEnd > new Date()) {
          return NextResponse.json({
            error: "Vui lòng chờ",
            cooldownRemaining: Math.floor((cooldownEnd.getTime() - Date.now()) / 1000),
          }, { status: 400 });
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayWatches = await prisma.adWatchHistory.count({
        where: { customerPointId: customerPoint.id, watchedAt: { gte: today } },
      });

      if (todayWatches >= ad.dailyLimit) {
        return NextResponse.json({ error: "Đã hết lượt xem hôm nay" }, { status: 400 });
      }

      if (customerPoint.level < ad.minLevel) {
        return NextResponse.json({
          error: `Cần đạt cấp ${ad.minLevel} để xem quảng cáo này`,
        }, { status: 400 });
      }

      customerPoint.balance += ad.points;
      customerPoint.totalEarned += ad.points;
      customerPoint.currentXp += ad.xpBonus;
      const xpNeeded = customerPoint.level * 100;
      if (customerPoint.currentXp >= xpNeeded) {
        customerPoint.level += 1;
        customerPoint.currentXp -= xpNeeded;
      }

      await prisma.customerPoint.update({
        where: { id: customerPoint.id },
        data: customerPoint,
      });

      await prisma.adWatchHistory.create({
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

      await prisma.pointTransaction.create({
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

      return NextResponse.json({
        success: true,
        action: "watch_ad",
        pointsEarned: ad.points,
        xpEarned: ad.xpBonus,
        newBalance: customerPoint.balance,
        level: customerPoint.level,
        cooldownRemaining: ad.watchCooldown,
      });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (error) {
    console.error("Error processing point action:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
