import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Lấy thông tin điểm của user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    // Nếu có session thì dùng email từ session, không thì dùng email param
    const userEmail = session?.user?.email || email;

    if (!userEmail) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    // Lấy hoặc tạo customer point account
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
      // Tạo account mới
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

    // Lấy các hoạt động có thể làm để kiếm điểm
    const activities = await prisma.pointActivity.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Lấy quảng cáo đang active
    const ads = await prisma.advertisement.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Lấy daily reward config
    const dailyRewards = await prisma.dailyReward.findMany({
      where: { isActive: true },
      orderBy: { day: "asc" },
    });

    // Kiểm tra xem user đã xem ad hôm nay chưa
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAdWatches = await prisma.adWatchHistory.count({
      where: {
        customerPointId: customerPoint.id,
        watchedAt: { gte: today },
      },
    });

    // Tính thời gian cooldown còn lại nếu có
    const lastAdWatch = await prisma.adWatchHistory.findFirst({
      where: {
        customerPointId: customerPoint.id,
      },
      orderBy: { watchedAt: "desc" },
    });

    let cooldownRemaining = 0;
    if (lastAdWatch) {
      const cooldownEnd = new Date(lastAdWatch.watchedAt);
      cooldownEnd.setSeconds(cooldownEnd.getSeconds() + 3600); // 1 hour cooldown
      if (cooldownEnd > new Date()) {
        cooldownRemaining = Math.floor((cooldownEnd.getTime() - Date.now()) / 1000);
      }
    }

    return NextResponse.json({
      data: {
        points: customerPoint,
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

// POST - Các actions để kiếm điểm
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { action, adId, email } = body;

    const userEmail = session.user.email;

    // Lấy hoặc tạo customer point account
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

    switch (action) {
      case "daily_login": {
        // Kiểm tra đã đăng nhập hôm nay chưa
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (customerPoint.lastLoginDate) {
          const lastLogin = new Date(customerPoint.lastLoginDate);
          lastLogin.setHours(0, 0, 0, 0);

          if (lastLogin.getTime() === today.getTime()) {
            return NextResponse.json({ error: "Đã nhận thưởng đăng nhập hôm nay" }, { status: 400 });
          }

          // Kiểm tra có phải chuỗi liên tiếp không
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

        // Tính điểm thưởng theo chuỗi
        const dailyReward = await prisma.dailyReward.findUnique({
          where: { day: Math.min(customerPoint.loginStreak, 7) }, // Max 7 ngày
        });

        const pointsEarned = dailyReward?.points || 10;
        const xpEarned = dailyReward?.xpBonus || 1;

        // Cập nhật điểm
        customerPoint.balance += pointsEarned;
        customerPoint.totalEarned += pointsEarned;
        customerPoint.currentXp += xpEarned;
        customerPoint.lastLoginDate = new Date();

        // Cập nhật level nếu đủ XP
        const xpNeeded = customerPoint.level * 100;
        if (customerPoint.currentXp >= xpNeeded) {
          customerPoint.level += 1;
          customerPoint.currentXp = customerPoint.currentXp - xpNeeded;
        }

        await prisma.customerPoint.update({
          where: { id: customerPoint.id },
          data: customerPoint,
        });

        // Tạo transaction
        await prisma.pointTransaction.create({
          data: {
            customerPointId: customerPoint.id,
            type: "earn",
            amount: pointsEarned,
            source: "daily_login",
            description: `Điểm thưởng đăng nhập ngày thứ ${customerPoint.loginStreak}`,
            referenceId: null,
            referenceType: null,
          },
        });

        return NextResponse.json({
          success: true,
          pointsEarned,
          xpEarned,
          newBalance: customerPoint.balance,
          loginStreak: customerPoint.loginStreak,
          level: customerPoint.level,
        });
      }

      case "watch_ad": {
        if (!adId) {
          return NextResponse.json({ error: "Thiếu ID quảng cáo" }, { status: 400 });
        }

        // Lấy thông tin quảng cáo
        const ad = await prisma.advertisement.findUnique({
          where: { id: adId },
        });

        if (!ad) {
          return NextResponse.json({ error: "Quảng cáo không tồn tại" }, { status: 404 });
        }

        // Kiểm tra cooldown
        const lastWatch = await prisma.adWatchHistory.findFirst({
          where: { customerPointId: customerPoint.id },
          orderBy: { watchedAt: "desc" },
        });

        if (lastWatch) {
          const cooldownEnd = new Date(lastWatch.watchedAt);
          cooldownEnd.setSeconds(cooldownEnd.getSeconds() + ad.watchCooldown);

          if (cooldownEnd > new Date()) {
            const remaining = Math.floor((cooldownEnd.getTime() - Date.now()) / 1000);
            return NextResponse.json({
              error: "Vui lòng chờ",
              cooldownRemaining: remaining,
            }, { status: 400 });
          }
        }

        // Kiểm tra giới hạn hàng ngày
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayWatches = await prisma.adWatchHistory.count({
          where: {
            customerPointId: customerPoint.id,
            watchedAt: { gte: today },
          },
        });

        if (todayWatches >= ad.dailyLimit) {
          return NextResponse.json({ error: "Đã hết lượt xem hôm nay" }, { status: 400 });
        }

        // Kiểm tra level yêu cầu
        if (customerPoint.level < ad.minLevel) {
          return NextResponse.json({
            error: `Cần đạt cấp ${ad.minLevel} để xem quảng cáo này`,
          }, { status: 400 });
        }

        // Cập nhật điểm
        customerPoint.balance += ad.points;
        customerPoint.totalEarned += ad.points;
        customerPoint.currentXp += ad.xpBonus;

        // Cập nhật level nếu đủ XP
        const xpNeeded = customerPoint.level * 100;
        if (customerPoint.currentXp >= xpNeeded) {
          customerPoint.level += 1;
          customerPoint.currentXp = customerPoint.currentXp - xpNeeded;
        }

        await prisma.customerPoint.update({
          where: { id: customerPoint.id },
          data: customerPoint,
        });

        // Ghi nhận đã xem
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

        // Tạo transaction
        await prisma.pointTransaction.create({
          data: {
            customerPointId: customerPoint.id,
            type: "earn",
            amount: ad.points,
            source: "watch_ad",
            description: `Xem quảng cáo: ${ad.titleVi}`,
            referenceId: ad.id,
            referenceType: "advertisement",
          },
        });

        return NextResponse.json({
          success: true,
          pointsEarned: ad.points,
          xpEarned: ad.xpBonus,
          newBalance: customerPoint.balance,
          level: customerPoint.level,
          cooldownRemaining: ad.watchCooldown,
        });
      }

      default:
        return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing point action:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
