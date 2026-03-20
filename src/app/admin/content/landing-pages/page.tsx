"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, Layout, Globe } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface LandingPage {
  id: string;
  slug: string;
  name: string;
  locale: string;
  isPublished: boolean;
  isDefault: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { sections: number };
}

interface LandingPageFormData {
  slug: string;
  name: string;
  locale: string;
  isPublished: boolean;
  isDefault: boolean;
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
}

const emptyForm: LandingPageFormData = {
  slug: "",
  name: "",
  locale: "vi",
  isPublished: false,
  isDefault: false,
  seoTitle: "",
  seoDesc: "",
  seoKeywords: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminLandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<LandingPage | null>(null);
  const [formData, setFormData] = useState<LandingPageFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/landing-pages?${params}`);
      const json = await res.json();

      if (json.data) {
        setPages(json.data);
        setPagination(json.pagination);
      }
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, search);
  }, [fetchData, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setFormError("");
    setShowCreateModal(true);
  };

  const openEditModal = async (page: LandingPage) => {
    setEditingPage(page);
    setEditLoading(true);
    setFormError("");

    try {
      const res = await fetch(`/api/admin/landing-pages/${page.id}`);
      const json = await res.json();

      if (json.data) {
        setFormData({
          slug: json.data.slug,
          name: json.data.name,
          locale: json.data.locale,
          isPublished: json.data.isPublished,
          isDefault: json.data.isDefault,
          seoTitle: json.data.seoTitle || "",
          seoDesc: json.data.seoDesc || "",
          seoKeywords: json.data.seoKeywords || "",
        });
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      toast.error("Failed to load page data");
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormError("");

    try {
      const url = editingPage
        ? `/api/admin/landing-pages/${editingPage.id}`
        : "/api/admin/landing-pages";

      const res = await fetch(url, {
        method: editingPage ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save");
      }

      toast.success(editingPage ? "Page updated!" : "Page created!");
      setShowCreateModal(false);
      setEditingPage(null);
      fetchData(pagination.page, search);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPage) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/landing-pages/${deletingPage.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete");
      }

      toast.success("Page deleted!");
      setDeletingPage(null);
      fetchData(pagination.page, search);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (page: LandingPage) => {
    try {
      const res = await fetch(`/api/admin/landing-pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...page, isPublished: !page.isPublished }),
      });

      if (res.ok) {
        toast.success(page.isPublished ? "Page unpublished" : "Page published!");
        fetchData(pagination.page, search);
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const columns: ColumnDef<LandingPage>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-white">{row.original.name}</div>
          <div className="text-xs text-slate-400">/{row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "locale",
      header: "Locale",
      cell: ({ row }) => (
        <span className="uppercase text-xs font-medium px-2 py-1 bg-slate-700 rounded">
          {row.original.locale}
        </span>
      ),
    },
    {
      accessorKey: "_count.sections",
      header: "Sections",
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original._count.sections}</span>
      ),
    },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ row }) => (
        row.original.isDefault ? (
          <span className="text-xs font-medium px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
            Default
          </span>
        ) : (
          <span className="text-slate-500">-</span>
        )
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <button
          onClick={() => togglePublish(row.original)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
            row.original.isPublished
              ? "bg-green-500/20 text-green-400"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          {row.original.isPublished ? (
            <>
              <Eye className="w-3 h-3" /> Published
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" /> Draft
            </>
          )}
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/landing-pages/${row.original.id}`}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            title="Edit Sections"
          >
            <Layout className="w-4 h-4" />
          </Link>
          <button
            onClick={() => openEditModal(row.original)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            title="Edit Page"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingPage(row.original)}
            className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing Pages</h1>
          <p className="text-slate-400 mt-1">Manage your landing pages and sections</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Page
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search pages..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64 h-10 px-4 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={pages} loading={loading} />

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPage) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {editingPage ? "Edit Page" : "Create New Page"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPage(null);
                }}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {editLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Page Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: formData.slug || slugify(e.target.value),
                        });
                      }}
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="My Landing Page"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Slug (URL)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                        className="flex-1 h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="my-page"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Locale</label>
                    <select
                      value={formData.locale}
                      onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Published</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Default Page</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">SEO Settings</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="SEO Title"
                      />
                      <textarea
                        value={formData.seoDesc}
                        onChange={(e) => setFormData({ ...formData, seoDesc: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="SEO Description"
                      />
                      <input
                        type="text"
                        value={formData.seoKeywords}
                        onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="SEO Keywords (comma separated)"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-sm text-red-400">{formError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingPage(null);
                      }}
                      className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !formData.name || !formData.slug}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingPage ? "Update" : "Create"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Page?</h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete "{deletingPage.name}"? This will also delete all sections.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeletingPage(null)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
