"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Star } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";

interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  shortBio: string;
  image: string;
  expertise: string[];
  achievements: string[];
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  // New fields
  roleLevel: number;
  roleCategory: string | null;
  coverImage: string | null;
  quote: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string | null;
  social: Record<string, string> | null;
  isWorking: boolean;
  isFeatured: boolean;
}

interface FormData {
  name: string;
  slug: string;
  role: string;
  bio: string;
  shortBio: string;
  image: string;
  expertise: string;
  achievements: string;
  linkedin: string;
  twitter: string;
  github: string;
  sortOrder: number;
  isActive: boolean;
  // New fields
  roleLevel: number;
  roleCategory: string;
  coverImage: string;
  quote: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  isWorking: boolean;
  isFeatured: boolean;
}

const emptyForm: FormData = {
  name: "",
  slug: "",
  role: "",
  bio: "",
  shortBio: "",
  image: "",
  expertise: "",
  achievements: "",
  linkedin: "",
  twitter: "",
  github: "",
  sortOrder: 0,
  isActive: true,
  // New fields
  roleLevel: 4,
  roleCategory: "",
  coverImage: "",
  quote: "",
  email: "",
  phone: "",
  skills: "",
  experience: "",
  isWorking: true,
  isFeatured: false,
};

const roleLevelOptions = [
  { value: 0, label: "CEO / Founder" },
  { value: 1, label: "CTO / VP" },
  { value: 2, label: "Lead / Manager" },
  { value: 3, label: "Senior" },
  { value: 4, label: "Member" },
];

const roleCategoryOptions = [
  { value: "", label: "-- Chọn --" },
  { value: "leadership", label: "Leadership" },
  { value: "management", label: "Management" },
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "operations", label: "Operations" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/team?${params}`);
      const data = await res.json();
      setMembers(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingMember(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      slug: member.slug,
      role: member.role,
      bio: member.bio,
      shortBio: member.shortBio,
      image: member.image,
      expertise: member.expertise.join(", "),
      achievements: member.achievements.join(", "),
      linkedin: member.linkedin || "",
      twitter: member.twitter || "",
      github: member.github || "",
      sortOrder: member.sortOrder,
      isActive: member.isActive,
      // New fields
      roleLevel: member.roleLevel,
      roleCategory: member.roleCategory || "",
      coverImage: member.coverImage || "",
      quote: member.quote || "",
      email: member.email || "",
      phone: member.phone || "",
      skills: (member.skills || []).join(", "),
      experience: member.experience || "",
      isWorking: member.isWorking,
      isFeatured: member.isFeatured,
    });
    setShowModal(true);
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Xóa thành viên "${member.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Xóa thành viên thành công");
        fetchData(pagination.page, search);
      } else {
        const err = await res.json();
        toast.error(err.error || "Xóa thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const toggleActive = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái thành công");
        fetchData(pagination.page, search);
      } else {
        const err = await res.json();
        toast.error(err.error || "Cập nhật thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.role || !form.slug) {
      alert("Vui lòng điền tên, vai trò và slug");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        role: form.role,
        bio: form.bio,
        shortBio: form.shortBio,
        image: form.image,
        expertise: form.expertise
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        achievements: form.achievements
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        linkedin: form.linkedin || null,
        twitter: form.twitter || null,
        github: form.github || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        // New fields
        roleLevel: form.roleLevel,
        roleCategory: form.roleCategory || null,
        coverImage: form.coverImage || null,
        quote: form.quote || null,
        email: form.email || null,
        phone: form.phone || null,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: form.experience || null,
        isWorking: form.isWorking,
        isFeatured: form.isFeatured,
      };

      const url = editingMember
        ? `/api/admin/team/${editingMember.id}`
        : "/api/admin/team";
      const method = editingMember ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        toast.success(editingMember ? "Cập nhật thành viên thành công" : "Thêm thành viên thành công");
        fetchData(pagination.page, search);
      } else {
        const err = await res.json();
        toast.error(err.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | number | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !editingMember) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  };

  const columns: ColumnDef<TeamMember, unknown>[] = [
    {
      accessorKey: "name",
      header: "Tên",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-sm font-bold text-white">
            {row.original.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-white">{row.original.name}</p>
              {row.original.isFeatured && (
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-xs text-slate-500">{row.original.role}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roleLevel",
      header: "Cấp bậc",
      cell: ({ row }) => {
        const level = row.original.roleLevel;
        const label = roleLevelOptions.find((o) => o.value === level)?.label || "Member";
        const colors: Record<number, string> = {
          0: "bg-yellow-500/20 text-yellow-400",
          1: "bg-purple-500/20 text-purple-400",
          2: "bg-blue-500/20 text-blue-400",
          3: "bg-cyan-500/20 text-cyan-400",
          4: "bg-slate-500/20 text-slate-400",
        };
        return (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[level] || colors[4]}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">/{row.original.slug}</span>
      ),
    },
    {
      accessorKey: "expertise",
      header: "Chuyên môn",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.expertise.slice(0, 3).map((e, i) => (
            <span
              key={i}
              className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-400"
            >
              {e}
            </span>
          ))}
          {row.original.expertise.length > 3 && (
            <span className="text-[11px] text-slate-500">
              +{row.original.expertise.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Thứ tự",
      cell: ({ row }) => (
        <span className="text-slate-400">{row.original.sortOrder}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <button
          onClick={() => toggleActive(row.original)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            row.original.isActive
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {row.original.isActive ? (
            <>
              <Eye size={12} /> Hiển thị
            </>
          ) : (
            <>
              <EyeOff size={12} /> Ẩn
            </>
          )}
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row.original)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Đội ngũ</h1>
          <p className="text-sm text-slate-400">Thông tin team members</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Thêm thành viên
        </button>
      </div>

      <DataTable
        data={members}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm thành viên..."
        pagination={pagination}
        onSearch={(s) => {
          setSearch(s);
          fetchData(1, s);
        }}
        onPageChange={(page) => fetchData(page, search)}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingMember ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name & Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Tên <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Slug <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="nguyen-van-a"
                  />
                </div>
              </div>

              {/* Role & Role Level & Role Category */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Vai trò <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="Frontend Developer"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Cấp bậc
                  </label>
                  <select
                    value={form.roleLevel}
                    onChange={(e) => updateField("roleLevel", parseInt(e.target.value))}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    {roleLevelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Phân loại
                  </label>
                  <select
                    value={form.roleCategory}
                    onChange={(e) => updateField("roleCategory", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    {roleCategoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Tiểu sử
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Mô tả chi tiết về thành viên..."
                />
              </div>

              {/* Short Bio & Quote */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Tiểu sử ngắn</label>
                  <input
                    type="text"
                    value={form.shortBio}
                    onChange={(e) => updateField("shortBio", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="Mô tả ngắn gọn..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Câu nói / Slogan</label>
                  <input
                    type="text"
                    value={form.quote}
                    onChange={(e) => updateField("quote", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="&quot;Innovation is the key to success&quot;"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ImageUploader
                    label="Ảnh đại diện"
                    value={form.image}
                    onChange={(url) => updateField("image", url)}
                    folder="loop/team"
                    aspectRatio="square"
                  />
                </div>
                <div>
                  <ImageUploader
                    label="Ảnh bìa"
                    value={form.coverImage || ""}
                    onChange={(url) => updateField("coverImage", url)}
                    folder="loop/team/cover"
                    aspectRatio="landscape"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="email@company.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="+84 123 456 789"
                  />
                </div>
              </div>

              {/* Expertise & Skills */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Chuyên môn</label>
                  <input
                    type="text"
                    value={form.expertise}
                    onChange={(e) => updateField("expertise", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="React, TypeScript, Node.js"
                  />
                  <p className="mt-1 text-xs text-slate-500">Phân cách bằng dấu phẩy</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Kỹ năng</label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={(e) => updateField("skills", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="Problem Solving, Teamwork"
                  />
                  <p className="mt-1 text-xs text-slate-500">Phân cách bằng dấu phẩy</p>
                </div>
              </div>

              {/* Achievements & Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Thành tựu</label>
                  <input
                    type="text"
                    value={form.achievements}
                    onChange={(e) => updateField("achievements", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="AWS Certified, 5 năm kinh nghiệm"
                  />
                  <p className="mt-1 text-xs text-slate-500">Phân cách bằng dấu phẩy</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Kinh nghiệm</label>
                  <input
                    type="text"
                    value={form.experience}
                    onChange={(e) => updateField("experience", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="5+ năm phát triển web"
                  />
                </div>
              </div>

              {/* Social links */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">LinkedIn</label>
                  <input
                    type="text"
                    value={form.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="URL LinkedIn"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Twitter</label>
                  <input
                    type="text"
                    value={form.twitter}
                    onChange={(e) => updateField("twitter", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="URL Twitter"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">GitHub</label>
                  <input
                    type="text"
                    value={form.github}
                    onChange={(e) => updateField("github", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="URL GitHub"
                  />
                </div>
              </div>

              {/* Sort Order, Active, Working, Featured */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Thứ tự</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => updateField("isActive", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                    />
                    Hiển thị
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.isWorking}
                      onChange={(e) => updateField("isWorking", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                    />
                    Đang làm việc
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => updateField("isFeatured", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                    />
                    ⭐ Nổi bật
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : editingMember ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
