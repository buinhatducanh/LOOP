"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Coins,
  Search,
  Plus,
  Edit,
  Trash2,
  Gift,
  Eye,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Star,
} from "lucide-react";

interface PointCustomer {
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
  createdAt: string;
}

interface PointActivity {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description?: string;
  descriptionVi?: string;
  points: number;
  xpBonus: number;
  dailyLimit?: number;
  isActive: boolean;
}

interface Advertisement {
  id: string;
  slug: string;
  title: string;
  titleVi: string;
  videoUrl: string;
  duration: number;
  points: number;
  dailyLimit: number;
  watchCooldown: number;
  isActive: boolean;
}

export default function PointsManagementPage() {
  const [customers, setCustomers] = useState<PointCustomer[]>([]);
  const [activities, setActivities] = useState<PointActivity[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"customers" | "activities" | "ads">("customers");

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch customers with points
      const customersRes = await fetch("/api/admin/points");
      const customersData = await customersRes.json();
      setCustomers(customersData.data || []);

      // Fetch activities
      const activitiesRes = await fetch("/api/admin/points/activities");
      const activitiesData = await activitiesRes.json();
      setActivities(activitiesData.data || []);

      // Fetch ads
      const adsRes = await fetch("/api/admin/points/ads");
      const adsData = await adsRes.json();
      setAds(adsData.data || []);
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalXp = customers.reduce((sum, c) => sum + c.currentXp, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Điểm Thưởng</h1>
        <p className="text-sm text-slate-400 mt-1">
          Quản lý hệ thống tích điểm và phần thưởng cho khách hàng
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Coins size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {customers.length.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Khách hàng có điểm</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {totalPoints.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Tổng điểm đang lưu hành</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {totalXp.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Tổng XP kiếm được</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Star size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.max(...customers.map((c) => c.level), 0)}
              </p>
              <p className="text-sm text-slate-400">Cấp cao nhất</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "customers"
              ? "text-indigo-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Khách hàng
          {activeTab === "customers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "activities"
              ? "text-indigo-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Gift size={16} className="inline mr-2" />
          Hoạt động kiếm điểm
          {activeTab === "activities" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "ads"
              ? "text-indigo-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Eye size={16} className="inline mr-2" />
          Quảng cáo
          {activeTab === "ads" && (
            <div className="absolute bottom-0 left-0 right-0 h-0-5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* Search */}
      {activeTab === "customers" && (
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-900" />
          ))}
        </div>
      ) : (
        <>
          {/* Customers Tab */}
          {activeTab === "customers" && (
            <div className="space-y-4">
              {customers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Chưa có khách hàng nào có điểm</p>
                </div>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-slate-900 rounded-xl border border-slate-800 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-indigo-400">
                            {customer.userName?.[0]?.toUpperCase() || customer.userEmail[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {customer.userName || "Khách hàng"}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                              Level {customer.level}
                            </span>
                            {customer.loginStreak > 1 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                                <Clock size={12} />
                                {customer.loginStreak} ngày
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">{customer.userEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xl font-bold text-yellow-400">
                            {customer.balance.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">Điểm hiện có</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">
                            {customer.totalEarned.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">Đã kiếm</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-400">
                            {customer.currentXp} XP
                          </p>
                          <p className="text-xs text-slate-400">
                            {customer.level * 100 - customer.currentXp} XP đến level {customer.level + 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === "activities" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`bg-slate-900 rounded-xl border p-5 ${
                    activity.isActive ? "border-slate-800" : "border-red-500/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Gift size={20} className="text-yellow-400" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activity.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {activity.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{activity.nameVi}</h3>
                  <p className="text-sm text-slate-400 mb-3">{activity.descriptionVi}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-yellow-400 font-medium">
                      +{activity.points} điểm
                    </span>
                    {activity.xpBonus > 0 && (
                      <span className="text-purple-400">
                        +{activity.xpBonus} XP
                      </span>
                    )}
                    {activity.dailyLimit && (
                      <span className="text-slate-500">
                        Max {activity.dailyLimit}/ngày
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === "ads" && (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className={`bg-slate-900 rounded-xl border p-5 ${
                    ad.isActive ? "border-slate-800" : "border-red-500/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-20 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                      {ad.videoUrl.includes(".mp4") ? (
                        <video src={ad.videoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Eye size={32} className="text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{ad.titleVi}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-yellow-400 font-medium">
                              +{ad.points} điểm
                            </span>
                            <span className="text-slate-400">
                              {ad.duration}s
                            </span>
                            <span className="text-slate-400">
                              Max {ad.dailyLimit}/ngày
                            </span>
                            <span className="text-slate-400">
                              Cooldown {Math.floor(ad.watchCooldown / 60)}p
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ad.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {ad.isActive ? "Hoạt động" : "Tắt"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
