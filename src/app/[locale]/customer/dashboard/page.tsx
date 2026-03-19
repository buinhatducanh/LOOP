"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import {
  Coins,
  Gift,
  Clock,
  Play,
  Star,
  TrendingUp,
  LogOut,
  ChevronRight,
  Video,
  CheckCircle,
  Lock,
} from "lucide-react";

interface CustomerPoint {
  id: string;
  userEmail: string;
  userName?: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  level: number;
  currentXp: number;
  loginStreak: number;
  lastLoginDate?: string;
}

interface Advertisement {
  id: string;
  slug: string;
  titleVi: string;
  descriptionVi?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  points: number;
  xpBonus: number;
  dailyLimit: number;
  watchCooldown: number;
  minLevel: number;
  requiresPurchase: boolean;
}

interface DailyReward {
  day: number;
  points: number;
  xpBonus: number;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [pointData, setPointData] = useState<{
    points: CustomerPoint | null;
    ads: Advertisement[];
    dailyRewards: DailyReward[];
    todayAdWatches: number;
    cooldownRemaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [watchingAd, setWatchingAd] = useState<string | null>(null);

  useEffect(() => {
    fetchPointData();
  }, []);

  const fetchPointData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/points");
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setPointData(data.data);
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const claimDailyLogin = async () => {
    try {
      setClaimingReward("daily-login");
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "daily_login" }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`+${data.pointsEarned} điểm! ${data.xpEarned > 0 ? `+${data.xpEarned} XP` : ""}`);
        fetchPointData();
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setClaimingReward(null);
    }
  };

  const startWatchAd = (ad: Advertisement) => {
    setWatchingAd(ad.id);
  };

  const completeAdWatch = async (adId: string) => {
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "watch_ad", adId }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`+${data.pointsEarned} điểm!`);
        setWatchingAd(null);
        fetchPointData();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const xpToNextLevel = pointData?.points ? pointData.points.level * 100 - pointData.points.currentXp : 0;
  const loginClaimedToday = pointData?.points?.lastLoginDate
    ? new Date(pointData.points.lastLoginDate).toDateString() === new Date().toDateString()
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {pointData?.points?.userName || "Khách hàng"}
              </h1>
              <p className="text-sm text-slate-400">{pointData?.points?.userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Points Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-indigo-200">Số dư điểm</p>
              <p className="text-5xl font-bold">{pointData?.points?.balance || 0}</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Coins size={40} />
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-300" />
                Level {pointData?.points?.level || 1}
              </span>
              <span>{pointData?.points?.currentXp || 0} / {((pointData?.points?.level || 1) * 100)} XP</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{
                  width: `${((pointData?.points?.currentXp || 0) / ((pointData?.points?.level || 1) * 100)) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-indigo-200 mt-1">{xpToNextLevel} XP đến level {(pointData?.points?.level || 1) + 1}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-2xl font-bold">{pointData?.points?.totalEarned || 0}</p>
              <p className="text-sm text-indigo-200">Đã kiếm</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{pointData?.points?.totalSpent || 0}</p>
              <p className="text-sm text-indigo-200">Đã tiêu</p>
            </div>
            <div>
              <p className="text-2xl font-bold flex items-center gap-1">
                <Clock size={20} />
                {pointData?.points?.loginStreak || 0}
              </p>
              <p className="text-sm text-indigo-200">Chuỗi đăng nhập</p>
            </div>
          </div>
        </div>

        {/* Daily Login Reward */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift size={20} className="text-yellow-400" />
            Điểm thưởng đăng nhập
          </h2>

          <div className="flex items-center gap-4">
            {/* Streak display */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const reward = pointData?.dailyRewards?.find((r) => r.day === day);
                const isActive = day <= (pointData?.points?.loginStreak || 0);
                const isClaimable = day === (pointData?.points?.loginStreak || 0) + 1;

                return (
                  <div
                    key={day}
                    className={`w-12 h-16 rounded-lg flex flex-col items-center justify-center ${
                      isActive
                        ? "bg-green-500/20 border border-green-500"
                        : isClaimable
                        ? "bg-yellow-500/20 border border-yellow-500 animate-pulse"
                        : "bg-slate-800 border border-slate-700"
                    }`}
                  >
                    <span className="text-xs text-slate-400">Ngày</span>
                    <span className="text-lg font-bold">{day}</span>
                    <span className="text-xs text-yellow-400">+{reward?.points || 10}</span>
                  </div>
                );
              })}
            </div>

            {/* Claim button */}
            {!loginClaimedToday && (
              <button
                onClick={claimDailyLogin}
                disabled={claimingReward === "daily-login"}
                className="ml-auto px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold transition-colors disabled:opacity-50"
              >
                {claimingReward === "daily-login" ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" />
                ) : (
                  "Nhận thưởng"
                )}
              </button>
            )}
            {loginClaimedToday && (
              <div className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 text-green-400">
                <CheckCircle size={20} />
                Đã nhận hôm nay
              </div>
            )}
          </div>
        </div>

        {/* Watch Ads */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Video size={20} className="text-blue-400" />
            Xem video nhận điểm
          </h2>

          <div className="space-y-4">
            {pointData?.ads?.map((ad) => {
              const canWatch = ad.minLevel <= (pointData.points?.level || 1);
              const isLocked = !canWatch;

              return (
                <div
                  key={ad.id}
                  className={`bg-slate-800 rounded-xl p-4 flex items-center gap-4 ${
                    isLocked ? "opacity-50" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-32 h-20 rounded-lg bg-slate-700 flex items-center justify-center relative overflow-hidden">
                    {ad.thumbnailUrl ? (
                      <img src={ad.thumbnailUrl} alt={ad.titleVi} className="w-full h-full object-cover" />
                    ) : (
                      <Video size={24} className="text-slate-500" />
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded text-xs">
                      {ad.duration}s
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{ad.titleVi}</h3>
                      {isLocked && <Lock size={14} className="text-slate-500" />}
                    </div>
                    {ad.descriptionVi && (
                      <p className="text-sm text-slate-400 mt-1">{ad.descriptionVi}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-yellow-400">+{ad.points} điểm</span>
                      <span className="text-purple-400">+{ad.xpBonus} XP</span>
                      {isLocked && (
                        <span className="text-slate-500">Cần level {ad.minLevel}</span>
                      )}
                    </div>
                  </div>

                  {/* Watch button */}
                  {isLocked ? (
                    <div className="px-4 py-2 rounded-lg bg-slate-700 text-slate-500">
                      <Lock size={18} />
                    </div>
                  ) : (
                    <button
                      onClick={() => startWatchAd(ad)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-colors"
                    >
                      <Play size={18} />
                      Xem
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* How to earn more */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-400" />
            Cách kiếm thêm điểm
          </h2>

          <div className="space-y-3">
            {[
              { icon: "🛒", title: "Mua hàng", desc: "Nhận 100-500 điểm khi mua sản phẩm/dịch vụ" },
              { icon: "👥", title: "Giới thiệu bạn bè", desc: "Nhận 200 điểm khi bạn bè mua hàng qua link giới thiệu" },
              { icon: "⭐", title: "Đánh giá website", desc: "Nhận 50 điểm khi viết đánh giá về website đã mua" },
              { icon: "🚀", title: "Nâng cấp website", desc: "Nhận 150 điểm khi nâng cấp gói dịch vụ" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
                <ChevronRight size={20} className="ml-auto text-slate-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Watch Modal */}
      {watchingAd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6">
            <div className="aspect-video bg-black rounded-xl mb-4 flex items-center justify-center">
              <div className="text-center">
                <Video size={64} className="mx-auto mb-4 text-slate-600" />
                <p className="text-white">Video đang phát...</p>
                <p className="text-slate-400 text-sm">Cooldown: {formatTime(pointData?.cooldownRemaining || 0)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-slate-400">
                Nhận <span className="text-yellow-400 font-bold">
                  +{pointData?.ads?.find((a) => a.id === watchingAd)?.points || 0} điểm
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWatchingAd(null)}
                  className="px-6 py-2 rounded-lg bg-slate-800 text-white"
                >
                  Đóng
                </button>
                <button
                  onClick={() => completeAdWatch(watchingAd)}
                  className="px-6 py-2 rounded-lg bg-green-600 text-white"
                >
                  Hoàn thành
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
