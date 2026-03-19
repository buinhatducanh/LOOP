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
  achievements: string[];
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  isActive: boolean;
  createdAt: string;
  // Role fields
  roleLevel: number;
  coverImage: string | null;
  quote: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string | null;
  social: Record<string, string> | null;
  isWorking: boolean;
  isFeatured: boolean;
  memberExpertise: SelectedExpertise[];
  // HR fields
  birthDate: string | null;
  address: string | null;
  cccd: string | null;
  contractStart: string | null;
  experienceFrom: number | null;
  facebook: string | null;
  tiktok: string | null;
}

interface SelectedExpertise {
  expertiseId: string;
  level: number;
}

interface FormData {
  name: string;
  slug: string;
  role: string;
  bio: string;
  shortBio: string;
  image: string;
  achievements: string;
  linkedin: string;
  twitter: string;
  github: string;
  isActive: boolean;
  // Role fields
  roleLevel: number;
  coverImage: string;
  quote: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  isWorking: boolean;
  isFeatured: boolean;
  // Expertise with rating
  memberExpertise: SelectedExpertise[];
  // HR fields
  birthDate: string;
  address: string;
  cccd: string;
  contractStart: string;
  experienceFrom: number;
  facebook: string;
  tiktok: string;
}

const emptyForm: FormData = {
  name: "",
  slug: "",
  role: "",
  bio: "",
  shortBio: "",
  image: "",
  achievements: "",
  linkedin: "",
  twitter: "",
  github: "",
  isActive: true,
  // Role fields
  roleLevel: 4,
  coverImage: "",
  quote: "",
  email: "",
  phone: "",
  skills: "",
  experience: "",
  isWorking: true,
  isFeatured: false,
  memberExpertise: [],
  // HR fields
  birthDate: "",
  address: "",
  cccd: "",
  contractStart: "",
  experienceFrom: 0,
  facebook: "",
  tiktok: "",
};

const roleLevelOptions = [
  { value: 0, label: "CEO / Founder" },
  { value: 1, label: "CTO / VP" },
  { value: 2, label: "Lead / Manager" },
  { value: 3, label: "Senior" },
  { value: 4, label: "Member" },
];

// Experience years options
const experienceYearsOptions = [
  { value: 0, label: "Chưa có kinh nghiệm" },
  { value: 1, label: "1 năm" },
  { value: 2, label: "2 năm" },
  { value: 3, label: "3 năm" },
  { value: 4, label: "4 năm" },
  { value: 5, label: "5 năm" },
  { value: 6, label: "6 năm" },
  { value: 7, label: "7 năm" },
  { value: 8, label: "8 năm" },
  { value: 9, label: "9 năm" },
  { value: 10, label: "10 năm" },
  { value: 11, label: "11 năm" },
  { value: 12, label: "12 năm" },
  { value: 13, label: "13 năm" },
  { value: 14, label: "14 năm" },
  { value: 15, label: "15+ năm" },
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedExpertiseId, setSelectedExpertiseId] = useState("");
  const [selectedExpertiseLevel, setSelectedExpertiseLevel] = useState(5);
  const [expertises, setExpertises] = useState<{id: string; name: string; nameVi: string; category: string; categoryVi: string; icon: string | null; isActive: boolean}[]>([]);

  // Fetch expertises when modal opens
  useEffect(() => {
    if (showModal) {
      fetch("/api/admin/expertises?active=true")
        .then(r => r.json())
        .then(data => {
          console.log("Expertises loaded:", data.data);
          setExpertises(data.data || []);
        })
        .catch(console.error);
    }
  }, [showModal]);

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
    setSelectedExpertiseId("");
    setSelectedExpertiseLevel(5);
    setShowModal(true);
  };

  const openEdit = (member: TeamMember) => {
    // Use member data directly from table - no extra fetch needed
    console.log("openEdit - member image:", member.image);
    setEditingMember(member);
    setForm({
      name: member.name || "",
      slug: member.slug || "",
      role: member.role || "",
      bio: member.bio || "",
      shortBio: member.shortBio || "",
      image: member.image || "",
      achievements: member.achievements?.join(", ") || "",
      linkedin: member.linkedin || "",
      twitter: member.twitter || "",
      github: member.github || "",
      isActive: member.isActive ?? true,
      // Role fields
      roleLevel: member.roleLevel ?? 4,
      coverImage: member.coverImage || "",
      quote: member.quote || "",
      email: member.email || "",
      phone: member.phone || "",
      skills: (member.skills || []).join(", "),
      experience: member.experience || "",
      isWorking: member.isWorking ?? true,
      isFeatured: member.isFeatured ?? false,
      memberExpertise: member.memberExpertise || [],
      // HR fields - convert Date to dd/mm/yyyy format for display
      birthDate: (member as any).birthDate ? (() => {
        const date = new Date((member as any).birthDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      })() : "",
      address: (member as any).address || "",
      cccd: (member as any).cccd || "",
      contractStart: (member as any).contractStart ? (() => {
        const date = new Date((member as any).contractStart);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      })() : "",
      experienceFrom: (member as any).experienceFrom || 0,
      facebook: (member as any).facebook || "",
      tiktok: (member as any).tiktok || "",
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

  // Helper to wait for upload to complete
  const waitForUpload = async (): Promise<void> => {
    if (!isUploadingImage) return;
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!isUploadingImage) {
          clearInterval(check);
          resolve();
        }
      }, 500);
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.role || !form.slug) {
      alert("Vui lòng điền tên, vai trò và slug");
      return;
    }
    // Auto-wait for upload if in progress
    if (isUploadingImage) {
      setSaving(true);
      await waitForUpload();
    } else {
      setSaving(true);
    }
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        role: form.role,
        bio: form.bio,
        shortBio: form.shortBio,
        image: form.image || "",
        achievements: form.achievements
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        linkedin: form.linkedin || null,
        twitter: form.twitter || null,
        github: form.github || null,
        isActive: form.isActive,
        // Role fields
        roleLevel: form.roleLevel,
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
        // Member expertise with proficiency rating
        memberExpertise: form.memberExpertise,
        // HR fields
        birthDate: form.birthDate || null,
        address: form.address || null,
        cccd: form.cccd || null,
        contractStart: form.contractStart || null,
        experienceFrom: form.experienceFrom || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
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
      accessorKey: "image",
      header: "Ảnh",
      cell: ({ row }) => (
        <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-800">
          {row.original.image ? (
            <img
              src={row.original.image}
              alt={row.original.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-sm font-bold text-white">
              {row.original.name.charAt(0)}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
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
      accessorKey: "memberExpertise",
      header: "Kỹ năng",
      cell: ({ row }) => {
        const memberExpertise = row.original.memberExpertise || [];
        return (
          <div className="flex flex-wrap gap-1">
            {memberExpertise.slice(0, 3).map((e: any, i: number) => (
              <span
                key={i}
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  e.level >= 8 ? 'bg-green-500/20 text-green-400' :
                  e.level >= 6 ? 'bg-blue-500/20 text-blue-400' :
                  e.level >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}
              >
                {e.expertise?.nameVi || e.expertise?.name || ''} ({e.level}/10)
              </span>
            ))}
            {memberExpertise.length > 3 && (
              <span className="text-[11px] text-slate-500">
                +{memberExpertise.length - 3}
              </span>
            )}
          </div>
        );
      },
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

              {/* Role & Role Level */}
              <div className="grid grid-cols-2 gap-4">
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
                    onChange={(url) => {
                      console.log("Image uploaded:", url);
                      updateField("image", url);
                    }}
                    onUploadingChange={setIsUploadingImage}
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

              {/* Contact & HR Info */}
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

              {/* HR Fields - Personal Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Ngày sinh</label>
                  <input
                    type="text"
                    value={form.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">CCCD</label>
                  <input
                    type="text"
                    value={form.cccd}
                    onChange={(e) => updateField("cccd", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="012345678901"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Ngày vào công ty</label>
                  <input
                    type="text"
                    value={form.contractStart}
                    onChange={(e) => updateField("contractStart", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>

              {/* HR Fields - Address & Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="Quận/Huyện, Tỉnh/TP"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Kinh nghiệm từ</label>
                  <select
                    value={form.experienceFrom}
                    onChange={(e) => updateField("experienceFrom", parseInt(e.target.value))}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    {experienceYearsOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expertise Selection with Proficiency Rating */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Trường kỹ năng
                </label>
                <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                  {/* Add new expertise */}
                  <div className="mb-4 flex gap-3">
                    <div className="flex-1">
                      <select
                        className="h-9 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus:border-blue-500"
                        value={selectedExpertiseId}
                        onChange={(e) => setSelectedExpertiseId(e.target.value)}
                      >
                        <option value="">-- Chọn kỹ năng --</option>
                        {expertises.length === 0 && (
                          <option disabled>Chưa có kỹ năng nào</option>
                        )}
                        {expertises
                          .sort((a, b) => {
                            const catOrder = ['frontend', 'backend', 'mobile', 'design', 'devops', 'data', 'management', 'marketing', 'other'];
                            const aIdx = catOrder.indexOf(a.category);
                            const bIdx = catOrder.indexOf(b.category);
                            return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
                          })
                          .map((exp) => (
                            <option key={exp.id} value={exp.id}>
                              {exp.nameVi || exp.name} ({exp.categoryVi || exp.category})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <select
                        className="h-9 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white outline-none focus:border-blue-500"
                        value={selectedExpertiseLevel}
                        onChange={(e) => setSelectedExpertiseLevel(parseInt(e.target.value))}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}/10
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedExpertiseId) {
                          toast.error("Vui lòng chọn kỹ năng");
                          return;
                        }

                        // Check if already added
                        if (form.memberExpertise.some(me => me.expertiseId === selectedExpertiseId)) {
                          toast.error("Kỹ năng này đã được thêm");
                          return;
                        }

                        setForm(prev => ({
                          ...prev,
                          memberExpertise: [
                            ...prev.memberExpertise,
                            { expertiseId: selectedExpertiseId, level: selectedExpertiseLevel }
                          ]
                        }));

                        // Reset selection
                        setSelectedExpertiseId("");
                        setSelectedExpertiseLevel(5);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Plus size={16} /> Thêm
                    </button>
                  </div>

                  {/* Selected expertise list */}
                  {form.memberExpertise.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Kỹ năng đã chọn:</p>
                      {form.memberExpertise.map((me, index) => {
                        const exp = expertises.find(e => e.id === me.expertiseId);
                        return (
                          <div
                            key={me.expertiseId}
                            className="flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-white">
                                {exp?.nameVi || exp?.name || me.expertiseId}
                              </span>
                              <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                                me.level >= 8 ? 'bg-green-500/20 text-green-400' :
                                me.level >= 6 ? 'bg-blue-500/20 text-blue-400' :
                                me.level >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {me.level}/10
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  memberExpertise: prev.memberExpertise.filter((_, i) => i !== index)
                                }));
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-600 hover:text-red-400"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {form.memberExpertise.length === 0 && (
                    <p className="text-center text-sm text-slate-500">
                      Chưa có kỹ năng nào. Hãy chọn kỹ năng từ dropdown trên.
                    </p>
                  )}
                </div>
              </div>

              {/* Skills - simple text input */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Kỹ năng mềm</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Problem Solving, Teamwork, Communication"
                />
                <p className="mt-1 text-xs text-slate-500">Phân cách bằng dấu phẩy</p>
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
              <div className="grid grid-cols-5 gap-4">
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
                  <label className="mb-1 block text-sm font-medium text-slate-300">Facebook</label>
                  <input
                    type="text"
                    value={form.facebook}
                    onChange={(e) => updateField("facebook", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="URL Facebook"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">TikTok</label>
                  <input
                    type="text"
                    value={form.tiktok}
                    onChange={(e) => updateField("tiktok", e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="URL TikTok"
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

              {/* Active, Working, Featured */}
              <div className="grid grid-cols-3 gap-4">
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
