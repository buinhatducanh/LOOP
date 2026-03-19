"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Globe,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Website {
  id: string;
  domain: string;
  subdomain?: string;
  name: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  isMonitored: boolean;
  deployedAt?: string;
  websiteStats?: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Hoạt động", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  inactive: { label: "Không hoạt động", color: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
  suspended: { label: "Đình chỉ", color: "bg-red-500/20 text-red-400", icon: XCircle },
  expired: { label: "Hết hạn", color: "bg-slate-500/20 text-slate-400", icon: AlertCircle },
};

export default function CustomerWebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, [search, statusFilter]);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/customer-websites?${params}`);
      const data = await res.json();
      setWebsites(data.data || []);
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa website này?")) return;

    try {
      const res = await fetch(`/api/admin/customer-websites/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Xóa thành công");
        fetchWebsites();
      } else {
        toast.error("Lỗi xóa website");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const getTotalVisitors = (stats: any[] = []) => {
    return stats.reduce((sum, s) => sum + (s.visitors || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Website Khách hàng</h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi và quản lý các website đã bán cho khách hàng
          </p>
        </div>
        <button
          onClick={() => { setEditingWebsite(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus size={18} />
          Thêm Website
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Globe size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{websites.length}</p>
              <p className="text-sm text-slate-400">Tổng Website</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {websites.filter((w) => w.status === "active").length}
              </p>
              <p className="text-sm text-slate-400">Đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {websites.filter((w) => w.status === "suspended" || w.status === "expired").length}
              </p>
              <p className="text-sm text-slate-400">Cần chú ý</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {websites.reduce((sum, w) => sum + getTotalVisitors(w.websiteStats), 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Tổng Lượt truy cập</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm domain, tên, khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
          <option value="suspended">Đình chỉ</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* Website List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-900" />
          ))}
        </div>
      ) : websites.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Globe size={48} className="mx-auto mb-4 opacity-50" />
          <p>Chưa có website nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {websites.map((website) => {
            const status = statusConfig[website.status] || statusConfig.inactive;
            const StatusIcon = status.icon;
            const totalVisitors = getTotalVisitors(website.websiteStats);

            return (
              <div
                key={website.id}
                className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Globe size={24} className="text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{website.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      <a
                        href={`https://${website.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        {website.domain}
                        <ExternalLink size={12} />
                      </a>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        {website.customerName && <span>{website.customerName}</span>}
                        {website.customerEmail && <span>{website.customerEmail}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {totalVisitors.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">Lượt truy cập</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`https://${website.domain}`, "_blank")}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Xem website"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => { setEditingWebsite(website); setShowModal(true); }}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(website.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mini Stats Bar */}
                {website.websiteStats && website.websiteStats.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-400" />
                        <span className="text-slate-400">7 ngày gần nhất:</span>
                        <span className="text-white font-medium">
                          {website.websiteStats.slice(0, 7).reduce((sum, s) => sum + s.visitors, 0).toLocaleString()} visitors
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Uptime:</span>
                        <span className="text-green-400 font-medium">
                          {(website.websiteStats.reduce((sum, s) => sum + s.uptime, 0) / website.websiteStats.length).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
