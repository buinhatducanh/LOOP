"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, Gift, Settings2 } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AddonService {
  id: string;
  name: string;
  nameVi: string;
  type: string;
  price: number;
}

interface RewardTierItem {
  id: string;
  rewardTierId: string;
  addonServiceId: string;
  addonService: AddonService;
  quantity: number;
  durationMonths: number | null;
  description: string | null;
  sortOrder: number;
}

interface RewardTier {
  id: string;
  level: number;
  name: string;
  nameVi: string;
  description: string | null;
  minXp: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: RewardTierItem[];
  _count: { items: number };
}

interface TierFormData {
  level: number;
  name: string;
  nameVi: string;
  description: string;
  minXp: number;
  isActive: boolean;
}

interface ItemFormData {
  addonServiceId: string;
  quantity: number;
  durationMonths: number | null;
  description: string;
  sortOrder: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const defaultTierForm: TierFormData = {
  level: 2,
  name: "",
  nameVi: "",
  description: "",
  minXp: 100,
  isActive: true,
};

const defaultItemForm: ItemFormData = {
  addonServiceId: "",
  quantity: 1,
  durationMonths: null,
  description: "",
  sortOrder: 0,
};

function getLevelColor(level: number) {
  switch (level) {
    case 2:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case 3:
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case 4:
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default:
      return "bg-green-500/20 text-green-400 border-green-500/30";
  }
}

function formatNumber(n: number) {
  return n.toLocaleString("vi-VN");
}

// ── Page Component ─────────────────────────────────────────────────────────────

export default function RewardTiersPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tier modal
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  const [tierForm, setTierForm] = useState<TierFormData>(defaultTierForm);

  // Items modal
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [tierItems, setTierItems] = useState<RewardTierItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Item sub-modal
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RewardTierItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(defaultItemForm);
  const [savingItem, setSavingItem] = useState(false);

  // Addon services for select
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "tier" | "item";
    id: string;
    parentId?: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reward-tiers?page=${pagination.page}&pageSize=${pagination.pageSize}`
      );
      if (!res.ok) throw new Error("Failed to fetch reward tiers");
      const json = await res.json();
      setTiers(json.data);
      setPagination(json.pagination);
    } catch {
      toast.error("Không thể tải danh sách reward tiers");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  const fetchTierItems = useCallback(async (tierId: string) => {
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/admin/reward-tiers/${tierId}/items`);
      if (!res.ok) throw new Error("Failed to fetch tier items");
      const json = await res.json();
      setTierItems(Array.isArray(json) ? json : json.data ?? []);
    } catch {
      toast.error("Không thể tải danh sách ưu đãi");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const fetchAddonServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/addon-services");
      if (!res.ok) throw new Error("Failed to fetch addon services");
      const json = await res.json();
      setAddonServices(Array.isArray(json) ? json : json.data ?? []);
    } catch {
      toast.error("Không thể tải danh sách addon services");
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // ── Summary Cards ──────────────────────────────────────────────────────────

  const summaryStats = useMemo(() => {
    const totalLevels = tiers.length;
    const activeCount = tiers.filter((t) => t.isActive).length;
    const totalRewards = tiers.reduce((sum, t) => sum + (t._count?.items ?? 0), 0);
    return { totalLevels, activeCount, totalRewards };
  }, [tiers]);

  // ── Tier CRUD ──────────────────────────────────────────────────────────────

  const openCreateTier = () => {
    setEditingTier(null);
    setTierForm(defaultTierForm);
    setShowTierModal(true);
  };

  const openEditTier = (tier: RewardTier) => {
    setEditingTier(tier);
    setTierForm({
      level: tier.level,
      name: tier.name,
      nameVi: tier.nameVi,
      description: tier.description ?? "",
      minXp: tier.minXp,
      isActive: tier.isActive,
    });
    setShowTierModal(true);
  };

  const handleSaveTier = async () => {
    if (!tierForm.nameVi.trim()) {
      toast.error("Vui lòng nhập tên tiếng Việt");
      return;
    }
    if (!tierForm.name.trim()) {
      toast.error("Vui lòng nhập tên tiếng Anh");
      return;
    }
    if (tierForm.level < 1) {
      toast.error("Level phải lớn hơn 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...tierForm,
        description: tierForm.description.trim() || null,
      };

      const url = editingTier
        ? `/api/admin/reward-tiers/${editingTier.id}`
        : "/api/admin/reward-tiers";
      const method = editingTier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save");
      }

      toast.success(editingTier ? "Cập nhật level thành công" : "Tạo level thành công");
      setShowTierModal(false);
      fetchTiers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi lưu level";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tier: RewardTier) => {
    try {
      const res = await fetch(`/api/admin/reward-tiers/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tier.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success(
        tier.isActive ? "Đã tắt level" : "Đã kích hoạt level"
      );
      fetchTiers();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteTier = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "tier") return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reward-tiers/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Xóa level thành công");
      setDeleteConfirm(null);
      fetchTiers();
    } catch {
      toast.error("Không thể xóa level");
    } finally {
      setDeleting(false);
    }
  };

  // ── Items CRUD ─────────────────────────────────────────────────────────────

  const openManageItems = async (tier: RewardTier) => {
    setSelectedTier(tier);
    setShowItemsModal(true);
    fetchTierItems(tier.id);
    if (addonServices.length === 0) {
      fetchAddonServices();
    }
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm(defaultItemForm);
    setShowItemForm(true);
  };

  const openEditItem = (item: RewardTierItem) => {
    setEditingItem(item);
    setItemForm({
      addonServiceId: item.addonServiceId,
      quantity: item.quantity,
      durationMonths: item.durationMonths,
      description: item.description ?? "",
      sortOrder: item.sortOrder,
    });
    setShowItemForm(true);
  };

  const handleSaveItem = async () => {
    if (!selectedTier) return;
    if (!itemForm.addonServiceId) {
      toast.error("Vui lòng chọn addon service");
      return;
    }

    setSavingItem(true);
    try {
      const payload = {
        ...itemForm,
        description: itemForm.description.trim() || null,
        durationMonths: itemForm.durationMonths || null,
      };

      const url = editingItem
        ? `/api/admin/reward-tiers/${selectedTier.id}/items/${editingItem.id}`
        : `/api/admin/reward-tiers/${selectedTier.id}/items`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save item");
      }

      toast.success(editingItem ? "Cập nhật ưu đãi thành công" : "Thêm ưu đãi thành công");
      setShowItemForm(false);
      fetchTierItems(selectedTier.id);
      fetchTiers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi lưu ưu đãi";
      toast.error(message);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "item" || !deleteConfirm.parentId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/reward-tiers/${deleteConfirm.parentId}/items/${deleteConfirm.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete item");
      toast.success("Xóa ưu đãi thành công");
      setDeleteConfirm(null);
      fetchTierItems(deleteConfirm.parentId);
      fetchTiers();
    } catch {
      toast.error("Không thể xóa ưu đãi");
    } finally {
      setDeleting(false);
    }
  };

  // ── Table Columns ──────────────────────────────────────────────────────────

  const columns: ColumnDef<RewardTier>[] = useMemo(
    () => [
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => {
          const level = row.original.level;
          return (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getLevelColor(level)}`}
            >
              Level {level}
            </span>
          );
        },
      },
      {
        accessorKey: "nameVi",
        header: "Tên",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-white">{row.original.nameVi}</div>
            <div className="text-sm text-slate-400">{row.original.name}</div>
          </div>
        ),
      },
      {
        accessorKey: "minXp",
        header: "XP tối thiểu",
        cell: ({ row }) => (
          <span className="font-mono text-slate-300">
            {formatNumber(row.original.minXp)} XP
          </span>
        ),
      },
      {
        id: "rewards",
        header: "Rewards",
        cell: ({ row }) => {
          const count = row.original._count?.items ?? 0;
          return (
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Gift className="h-4 w-4 text-amber-400" />
              {count} ưu đãi
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => {
          const active = row.original.isActive;
          return (
            <button
              onClick={() => handleToggleActive(row.original)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {active ? (
                <>
                  <Eye className="h-3.5 w-3.5" /> Hoạt động
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Tắt
                </>
              )}
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditTier(row.original)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              title="Chỉnh sửa"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => openManageItems(row.original)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-amber-400"
              title="Quản lý ưu đãi"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setDeleteConfirm({
                  type: "tier",
                  id: row.original.id,
                  name: `Level ${row.original.level} - ${row.original.nameVi}`,
                })
              }
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-600/20 hover:text-red-400"
              title="Xóa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cấu hình XP &amp; Rewards</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý mức thưởng theo level XP (100 XP mỗi level)
          </p>
        </div>
        <button
          onClick={openCreateTier}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Thêm Level
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Tổng level</p>
          <p className="mt-1 text-2xl font-bold text-white">{summaryStats.totalLevels}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Đang hoạt động</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{summaryStats.activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Tổng rewards</p>
          <p className="mt-1 text-2xl font-bold text-white">{summaryStats.totalRewards}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">XP mỗi level</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">100</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800">
        <DataTable columns={columns} data={tiers} loading={loading} />
      </div>

      {/* ── Create / Edit Tier Modal ────────────────────────────────────────── */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">
                {editingTier ? "Chỉnh sửa Level" : "Thêm Level mới"}
              </h2>
              <button
                onClick={() => setShowTierModal(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Level <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tierForm.level}
                    onChange={(e) => {
                      const level = parseInt(e.target.value) || 0;
                      setTierForm((f) => ({
                        ...f,
                        level,
                        minXp: (level - 1) * 100,
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    XP tối thiểu
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tierForm.minXp}
                    onChange={(e) =>
                      setTierForm((f) => ({ ...f, minXp: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Gợi ý: (level - 1) &times; 100 = {(tierForm.level - 1) * 100}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Tên tiếng Việt <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Dự án Nâng cao"
                  value={tierForm.nameVi}
                  onChange={(e) => setTierForm((f) => ({ ...f, nameVi: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Tên tiếng Anh <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Projects"
                  value={tierForm.name}
                  onChange={(e) => setTierForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả về level này (tuỳ chọn)"
                  value={tierForm.description}
                  onChange={(e) => setTierForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={tierForm.isActive}
                  onChange={(e) => setTierForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                Kích hoạt level này
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4">
              <button
                onClick={() => setShowTierModal(false)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTier}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTier ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Items Modal ──────────────────────────────────────────────── */}
      {showItemsModal && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Quản lý ưu đãi &mdash; Level {selectedTier.level}
                </h2>
                <p className="text-sm text-slate-400">{selectedTier.nameVi}</p>
              </div>
              <button
                onClick={() => {
                  setShowItemsModal(false);
                  setSelectedTier(null);
                  setTierItems([]);
                }}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {tierItems.length} ưu đãi trong level này
                </p>
                <button
                  onClick={openAddItem}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Thêm ưu đãi
                </button>
              </div>

              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : tierItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Gift className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                  <p>Chưa có ưu đãi nào</p>
                  <p className="text-sm">Bấm &ldquo;Thêm ưu đãi&rdquo; để bắt đầu</p>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {tierItems
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white">
                            {item.addonService?.nameVi || item.addonService?.name || "—"}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                            <span>SL: {item.quantity}</span>
                            {item.durationMonths && (
                              <span>&bull; {item.durationMonths} tháng</span>
                            )}
                            <span>&bull; Thứ tự: {item.sortOrder}</span>
                            {item.description && (
                              <span className="truncate">&bull; {item.description}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-1">
                          <button
                            onClick={() => openEditItem(item)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: "item",
                                id: item.id,
                                parentId: selectedTier.id,
                                name: item.addonService?.nameVi || item.addonService?.name || "ưu đãi",
                              })
                            }
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-600/20 hover:text-red-400"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Item Sub-Modal ───────────────────────────────────────── */}
      {showItemForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">
                {editingItem ? "Chỉnh sửa ưu đãi" : "Thêm ưu đãi"}
              </h2>
              <button
                onClick={() => setShowItemForm(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Addon Service <span className="text-red-400">*</span>
                </label>
                <select
                  value={itemForm.addonServiceId}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, addonServiceId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {addonServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameVi || s.name} — {formatNumber(s.price)}đ
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Thời hạn (tháng)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Tuỳ chọn"
                    value={itemForm.durationMonths ?? ""}
                    onChange={(e) =>
                      setItemForm((f) => ({
                        ...f,
                        durationMonths: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                  value={itemForm.description}
                  onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min={0}
                  value={itemForm.sortOrder}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4">
              <button
                onClick={() => setShowItemForm(false)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveItem}
                disabled={savingItem}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {savingItem && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingItem ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-white">Xác nhận xóa</h3>
              <p className="mt-2 text-sm text-slate-400">
                Bạn có chắc muốn xóa{" "}
                <span className="font-medium text-white">{deleteConfirm.name}</span>?
                {deleteConfirm.type === "tier" && (
                  <span className="mt-1 block text-red-400">
                    Tất cả ưu đãi trong level này cũng sẽ bị xóa.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={
                  deleteConfirm.type === "tier" ? handleDeleteTier : handleDeleteItem
                }
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
